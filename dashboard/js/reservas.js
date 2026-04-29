// reservas.js — CRUD de reservas Airbnb/Booking + integración con calendario
// API pública: window.reservas = { init, render, openNew, openEdit }

(function () {
  let filter = 'proximas'; // 'proximas' | 'curso' | 'pasadas' | 'todas'

  const PLATFORM_LABEL = {
    airbnb: 'Airbnb',
    booking: 'Booking',
    directo: 'Directo',
  };

  function todayYmd() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return ymd(d);
  }

  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function fmt$(n) {
    if (!n) return '$0';
    return '$' + Number(n).toLocaleString('es-AR');
  }

  function fmtDate(s) {
    if (!s) return '—';
    const [y, m, d] = s.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  function nights(checkin, checkout) {
    if (!checkin || !checkout) return 0;
    const a = new Date(checkin);
    const b = new Date(checkout);
    return Math.max(0, Math.round((b - a) / 86400000));
  }

  function applyFilter(list) {
    const t = todayYmd();
    if (filter === 'todas') return list;
    if (filter === 'proximas') return list.filter((r) => r.checkin && r.checkin > t);
    if (filter === 'curso')
      return list.filter((r) => r.checkin && r.checkout && r.checkin <= t && r.checkout > t);
    if (filter === 'pasadas') return list.filter((r) => r.checkout && r.checkout <= t);
    return list;
  }

  function totalConfirmadas() {
    return storage.reservas
      .list()
      .filter((r) => r.status === 'confirmada')
      .reduce((s, r) => s + (Number(r.amount) || 0), 0);
  }

  function render() {
    const grid = document.getElementById('reservas-grid');
    grid.innerHTML = '';

    const all = storage.reservas
      .list()
      .slice()
      .sort((a, b) => (a.checkin || '').localeCompare(b.checkin || ''));
    const filtered = applyFilter(all);

    document.querySelectorAll('#reservas-filters button').forEach((b) => {
      b.classList.toggle('active', b.dataset.filter === filter);
    });

    document.getElementById('reservas-total').textContent = fmt$(totalConfirmadas());

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.style.gridColumn = '1 / -1';
      empty.innerHTML = '<h3>Sin reservas en esta vista</h3><div>Probá otro filtro o agregá una nueva</div>';
      grid.appendChild(empty);
      return;
    }

    filtered.forEach((r) => grid.appendChild(renderCard(r)));
  }

  function renderCard(r) {
    const card = document.createElement('div');
    card.className = 'reserva-card ' + (r.platform || '');

    const platform = document.createElement('div');
    platform.className = 'reserva-platform';
    platform.textContent = PLATFORM_LABEL[r.platform] || r.platform || 'Reserva';
    card.appendChild(platform);

    const guest = document.createElement('div');
    guest.className = 'reserva-guest';
    guest.textContent = r.guest || '(sin huésped)';
    card.appendChild(guest);

    if (r.property) {
      const prop = document.createElement('div');
      prop.className = 'reserva-property';
      prop.textContent = r.property;
      card.appendChild(prop);
    }

    const dates = document.createElement('div');
    dates.className = 'reserva-dates';
    const n = nights(r.checkin, r.checkout);
    dates.textContent = `${fmtDate(r.checkin)} → ${fmtDate(r.checkout)}  ·  ${n} ${n === 1 ? 'noche' : 'noches'}`;
    card.appendChild(dates);

    const row = document.createElement('div');
    row.className = 'reserva-row';

    const status = document.createElement('span');
    status.className = `status-pill ${r.status || 'pendiente'}`;
    status.textContent = r.status || 'pendiente';
    row.appendChild(status);

    const amount = document.createElement('span');
    amount.className = 'reserva-amount';
    amount.textContent = fmt$(r.amount);
    row.appendChild(amount);

    card.appendChild(row);

    card.addEventListener('click', () => openEdit(r.id));
    return card;
  }

  // ===== Modal =====

  function openNew() {
    const modal = document.getElementById('modal-reserva');
    document.getElementById('reserva-modal-title').textContent = 'Nueva reserva';
    document.getElementById('reserva-id').value = '';
    document.getElementById('reserva-platform').value = 'airbnb';
    document.getElementById('reserva-status').value = 'confirmada';
    document.getElementById('reserva-guest').value = '';
    document.getElementById('reserva-property').value = '';
    document.getElementById('reserva-checkin').value = '';
    document.getElementById('reserva-checkout').value = '';
    document.getElementById('reserva-amount').value = '';
    document.getElementById('reserva-note').value = '';
    document.getElementById('reserva-delete').style.display = 'none';
    window.app.openModal(modal);
    setTimeout(() => document.getElementById('reserva-guest').focus(), 50);
  }

  function openEdit(id) {
    const r = storage.reservas.get(id);
    if (!r) return;
    const modal = document.getElementById('modal-reserva');
    document.getElementById('reserva-modal-title').textContent = 'Editar reserva';
    document.getElementById('reserva-id').value = r.id;
    document.getElementById('reserva-platform').value = r.platform || 'airbnb';
    document.getElementById('reserva-status').value = r.status || 'confirmada';
    document.getElementById('reserva-guest').value = r.guest || '';
    document.getElementById('reserva-property').value = r.property || '';
    document.getElementById('reserva-checkin').value = r.checkin || '';
    document.getElementById('reserva-checkout').value = r.checkout || '';
    document.getElementById('reserva-amount').value = r.amount || '';
    document.getElementById('reserva-note').value = r.note || '';
    document.getElementById('reserva-delete').style.display = '';
    window.app.openModal(modal);
  }

  function save() {
    const id = document.getElementById('reserva-id').value;
    const data = {
      platform: document.getElementById('reserva-platform').value,
      status: document.getElementById('reserva-status').value,
      guest: document.getElementById('reserva-guest').value.trim(),
      property: document.getElementById('reserva-property').value.trim(),
      checkin: document.getElementById('reserva-checkin').value,
      checkout: document.getElementById('reserva-checkout').value,
      amount: parseFloat(document.getElementById('reserva-amount').value) || 0,
      note: document.getElementById('reserva-note').value.trim(),
    };

    if (!data.guest) {
      window.app.toast('Falta el huésped');
      return;
    }
    if (!data.checkin || !data.checkout) {
      window.app.toast('Faltan las fechas');
      return;
    }
    if (data.checkout <= data.checkin) {
      window.app.toast('Check-out debe ser después del check-in');
      return;
    }

    if (id) storage.reservas.update(id, data);
    else storage.reservas.add(data);

    window.app.closeModal(document.getElementById('modal-reserva'));
    render();
    if (window.calendar) window.calendar.refresh();
    if (window.hoy) window.hoy.render();
    if (window.metricas) window.metricas.render();
    window.app.toast(id ? 'Actualizada' : 'Reserva guardada');
  }

  function remove() {
    const id = document.getElementById('reserva-id').value;
    if (!id) return;
    if (!confirm('¿Eliminar esta reserva?')) return;
    storage.reservas.remove(id);
    window.app.closeModal(document.getElementById('modal-reserva'));
    render();
    if (window.calendar) window.calendar.refresh();
    if (window.hoy) window.hoy.render();
    if (window.metricas) window.metricas.render();
    window.app.toast('Eliminada');
  }

  function init() {
    document.getElementById('reserva-new').addEventListener('click', openNew);
    document.getElementById('reserva-save').addEventListener('click', save);
    document.getElementById('reserva-delete').addEventListener('click', remove);

    document.querySelectorAll('#reservas-filters button').forEach((b) => {
      b.addEventListener('click', () => {
        filter = b.dataset.filter;
        render();
      });
    });

    render();
  }

  window.reservas = { init, render, openNew, openEdit };
})();
