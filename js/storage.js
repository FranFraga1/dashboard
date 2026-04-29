// storage.js — wrapper de persistencia con cache local + sync opcional
// Cache: localStorage (lecturas instantáneas, sincrónicas).
// Sync: si hay sesión Supabase, cada add/update/remove se encola para subir.
// La interfaz pública NO cambió desde la versión local-only.

(function () {
  const PREFIX = 'dashboard.';
  const TABLES = ['events', 'ideas', 'reservas'];
  const subscribers = new Set();

  function uid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function read(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('storage read failed', key, e);
      return [];
    }
  }

  function write(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }

  function emit() {
    subscribers.forEach((fn) => {
      try { fn(); } catch (e) { console.warn(e); }
    });
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  function pushSync(op) {
    if (window.sync && typeof window.sync.push === 'function') {
      window.sync.push(op);
    }
  }

  function makeCollection(table) {
    return {
      list() {
        return read(table);
      },
      get(id) {
        return read(table).find((x) => x.id === id) || null;
      },
      add(obj) {
        const items = read(table);
        const item = { id: uid(), createdAt: Date.now(), updatedAt: Date.now(), ...obj };
        if (!item.id) item.id = uid();
        items.push(item);
        write(table, items);
        pushSync({ kind: 'upsert', table, item });
        return item;
      },
      update(id, patch) {
        const items = read(table);
        const idx = items.findIndex((x) => x.id === id);
        if (idx === -1) return null;
        items[idx] = { ...items[idx], ...patch, updatedAt: Date.now() };
        write(table, items);
        pushSync({ kind: 'upsert', table, item: items[idx] });
        return items[idx];
      },
      remove(id) {
        const items = read(table).filter((x) => x.id !== id);
        write(table, items);
        pushSync({ kind: 'delete', table, id });
      },
      replaceAll(arr) {
        write(table, Array.isArray(arr) ? arr : []);
        emit();
      },
    };
  }

  const storage = {
    events: makeCollection('events'),
    ideas: makeCollection('ideas'),
    reservas: makeCollection('reservas'),

    subscribe,

    // Llamado por sync.js cuando llegan datos del servidor.
    // No reemita push (evita loops) y dispara emit() para que la UI re-renderice.
    _replaceLocal(table, items) {
      if (!TABLES.includes(table)) return;
      write(table, items);
      emit();
    },

    exportAll() {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        events: read('events'),
        ideas: read('ideas'),
        reservas: read('reservas'),
      };
    },

    importAll(data) {
      if (!data || typeof data !== 'object') throw new Error('JSON inválido');
      if (Array.isArray(data.events)) write('events', data.events);
      if (Array.isArray(data.ideas)) write('ideas', data.ideas);
      if (Array.isArray(data.reservas)) write('reservas', data.reservas);
      emit();
    },

    clearAll() {
      TABLES.forEach((t) => write(t, []));
      emit();
    },
  };

  window.storage = storage;
})();
