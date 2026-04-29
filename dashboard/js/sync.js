// sync.js — sincronización con Supabase
// Estrategia: cache-first (localStorage) + push diferido + pull periódico
// API pública: window.sync = { init, fullSync, push, getStatus, onStatusChange }

(function () {
  const TABLES = ['events', 'ideas', 'reservas'];
  const QUEUE_KEY = 'dashboard.syncQueue';

  let status = 'idle'; // 'idle' | 'syncing' | 'offline' | 'error'
  let lastError = null;
  const statusListeners = new Set();

  function setStatus(s, err) {
    status = s;
    lastError = err || null;
    statusListeners.forEach((fn) => {
      try { fn(s, err); } catch (e) { console.warn(e); }
    });
    updateIndicator();
  }

  function updateIndicator() {
    const dot = document.getElementById('sync-indicator');
    if (!dot) return;
    dot.className = 'sync-indicator ' + status;
    const labels = {
      idle: 'Sincronizado',
      syncing: 'Sincronizando…',
      offline: 'Sin conexión',
      error: lastError ? 'Error: ' + lastError : 'Error de sincronización',
      local: 'Modo local (sin sesión)',
    };
    dot.title = labels[status] || '';
    dot.style.display = window.auth && window.auth.isAuthenticated() ? '' : 'none';
  }

  function onStatusChange(fn) {
    statusListeners.add(fn);
    return () => statusListeners.delete(fn);
  }

  function getStatus() {
    return status;
  }

  // ===== Mappers entre formato local (camelCase) y remoto (snake_case)

  function toRemote(table, item, userId) {
    const base = { id: item.id, user_id: userId };
    const ts = (v) => (typeof v === 'number' ? new Date(v).toISOString() : v);
    if (table === 'events') {
      return {
        ...base,
        date: item.date,
        title: item.title,
        start_time: item.start || null,
        end_time: item.end || null,
        note: item.note || null,
        created_at: ts(item.createdAt) || new Date().toISOString(),
        updated_at: ts(item.updatedAt || item.createdAt) || new Date().toISOString(),
      };
    }
    if (table === 'ideas') {
      return {
        ...base,
        title: item.title,
        body: item.body || null,
        created_at: ts(item.createdAt) || new Date().toISOString(),
        updated_at: ts(item.updatedAt || item.createdAt) || new Date().toISOString(),
      };
    }
    if (table === 'reservas') {
      return {
        ...base,
        platform: item.platform || null,
        status: item.status || null,
        guest: item.guest || null,
        property: item.property || null,
        checkin: item.checkin || null,
        checkout: item.checkout || null,
        amount: item.amount != null ? Number(item.amount) : null,
        note: item.note || null,
        created_at: ts(item.createdAt) || new Date().toISOString(),
        updated_at: ts(item.updatedAt || item.createdAt) || new Date().toISOString(),
      };
    }
    return base;
  }

  function fromRemote(table, row) {
    const ts = (v) => (v ? new Date(v).getTime() : undefined);
    if (table === 'events') {
      return {
        id: row.id,
        date: row.date,
        title: row.title,
        start: row.start_time || '',
        end: row.end_time || '',
        note: row.note || '',
        createdAt: ts(row.created_at),
        updatedAt: ts(row.updated_at),
      };
    }
    if (table === 'ideas') {
      return {
        id: row.id,
        title: row.title,
        body: row.body || '',
        createdAt: ts(row.created_at),
        updatedAt: ts(row.updated_at),
      };
    }
    if (table === 'reservas') {
      return {
        id: row.id,
        platform: row.platform || '',
        status: row.status || '',
        guest: row.guest || '',
        property: row.property || '',
        checkin: row.checkin || '',
        checkout: row.checkout || '',
        amount: row.amount || 0,
        note: row.note || '',
        createdAt: ts(row.created_at),
        updatedAt: ts(row.updated_at),
      };
    }
    return row;
  }

  // ===== Cola de operaciones pendientes

  function readQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function writeQueue(q) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  }

  function enqueue(op) {
    const q = readQueue();
    q.push({ ...op, ts: Date.now() });
    writeQueue(q);
  }

  // ===== Push y pull

  async function pushOne(op) {
    const user = window.auth.getUser();
    if (!user) throw new Error('No hay sesión');
    const sb = window.supabaseClient;
    if (op.kind === 'upsert') {
      const remote = toRemote(op.table, op.item, user.id);
      const { error } = await sb.from(op.table).upsert(remote);
      if (error) throw error;
    } else if (op.kind === 'delete') {
      const { error } = await sb.from(op.table).delete().eq('id', op.id);
      if (error) throw error;
    }
  }

  async function flushQueue() {
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }
    if (!window.auth || !window.auth.isAuthenticated()) return;

    let q = readQueue();
    if (q.length === 0) return;

    setStatus('syncing');
    while (q.length > 0) {
      const op = q[0];
      try {
        await pushOne(op);
        q.shift();
        writeQueue(q);
      } catch (err) {
        console.warn('Sync push falló', err);
        setStatus('error', err.message || String(err));
        return;
      }
    }
    setStatus('idle');
  }

  async function pullTable(table) {
    const sb = window.supabaseClient;
    const { data, error } = await sb.from(table).select('*');
    if (error) throw error;
    const items = (data || []).map((r) => fromRemote(table, r));
    storage._replaceLocal(table, items);
  }

  async function pullAll() {
    setStatus('syncing');
    try {
      for (const t of TABLES) {
        await pullTable(t);
      }
      setStatus('idle');
      if (window.app && window.app.rerenderAll) window.app.rerenderAll();
    } catch (err) {
      console.warn('Sync pull falló', err);
      setStatus('error', err.message || String(err));
    }
  }

  async function fullSync() {
    if (!window.auth || !window.auth.isAuthenticated()) return;
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }
    await flushQueue();
    if (status === 'error' || status === 'offline') return;
    await pullAll();
  }

  // Llamado desde storage en cada add/update/remove
  function push(op) {
    if (!window.auth || !window.auth.isAuthenticated()) return;
    enqueue(op);
    flushQueue();
  }

  // ===== Migración de datos locales al crear sesión por primera vez

  async function offerMigration() {
    const local = {
      events: storage.events.list(),
      ideas: storage.ideas.list(),
      reservas: storage.reservas.list(),
    };
    const counts = {
      events: local.events.length,
      ideas: local.ideas.length,
      reservas: local.reservas.length,
    };
    const total = counts.events + counts.ideas + counts.reservas;
    if (total === 0) return;

    // Chequear si ya hay datos en remoto (para no preguntar si la cuenta tenía data)
    const sb = window.supabaseClient;
    const { count: remoteEvents } = await sb
      .from('events')
      .select('*', { count: 'exact', head: true });
    const { count: remoteIdeas } = await sb
      .from('ideas')
      .select('*', { count: 'exact', head: true });
    const { count: remoteReservas } = await sb
      .from('reservas')
      .select('*', { count: 'exact', head: true });
    const remoteTotal = (remoteEvents || 0) + (remoteIdeas || 0) + (remoteReservas || 0);

    if (remoteTotal > 0) return; // ya tiene datos en la nube, no migramos automáticamente

    const ok = confirm(
      `Encontramos datos locales en este dispositivo:\n` +
        `• ${counts.events} eventos\n` +
        `• ${counts.ideas} ideas\n` +
        `• ${counts.reservas} reservas\n\n` +
        `¿Subirlos a tu cuenta?`
    );
    if (!ok) return;

    setStatus('syncing');
    const user = window.auth.getUser();
    try {
      for (const table of TABLES) {
        const items = local[table];
        if (items.length === 0) continue;
        const rows = items.map((it) => toRemote(table, it, user.id));
        const { error } = await sb.from(table).upsert(rows);
        if (error) throw error;
      }
      setStatus('idle');
      window.app.toast('Datos subidos a tu cuenta');
    } catch (err) {
      console.warn('Migración falló', err);
      setStatus('error', err.message);
      alert('Error subiendo datos: ' + err.message);
    }
  }

  // ===== Init

  function init() {
    updateIndicator();

    window.addEventListener('online', () => {
      if (status === 'offline') flushQueue();
    });
    window.addEventListener('offline', () => setStatus('offline'));

    if (window.auth) {
      window.auth.onChange(async (session) => {
        if (session) {
          setStatus('syncing');
          await offerMigration();
          await fullSync();
        } else {
          setStatus('local');
          updateIndicator();
        }
      });
    }
  }

  window.sync = { init, fullSync, push, getStatus, onStatusChange };
})();
