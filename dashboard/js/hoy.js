// hoy.js — vista de inicio: eventos del día, próxima reserva, ideas recientes
// API pública: window.hoy = { init, render }

(function () {
  const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const PLATFORM_LABEL = { airbnb: 'Airbnb', booking: 'Booking', directo: 'Directo' };

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

  function fmtDateShort(s) {
    if (!s) return '—';
    const [y, m, d] = s.split('-').map(Number);
    return `${d} ${MESES[m - 1].slice(0, 3)}`;
  }

  function daysUntil(ymdStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = ymdStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    return Math.round((target - today) / 86400000);
  }

  function greet() {
    const h = new Date().getHours();
    if (h < 6) return 'Buenas noches';
    if (h < 13) return 'Buen día';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  function eventsToday() {
    const key = ymd(new Date());
    return storage.events
      .list()
      .filter((e) => e.date === key)
      .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  }

  function nextReservas(n = 3) {
    const today = ymd(new Date());
    return storage.reservas
      .list()
      .filter((r) => r.status !== 'cancelada' && r.checkout && r.checkout > today)
      .sort((a, b) => (a.checkin || '').localeCompare(b.checkin || ''))
      .slice(0, n);
  }

  function recentIdeas(n = 4) {
    return storage.ideas.list().slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, n);
  }

  function render() {
    const now = new Date();
    document.getElementById('hoy-title').textContent = `${greet()}, Francho`;
    document.getElementById('hoy-date').textContent =
      `${DIAS[now.getDay()]} ${now.getDate()} de ${MESES[now.getMonth()]}`;

    const body = document.getElementById('hoy-body');
    body.innerHTML = '';

    body.appendChild(renderEventsBlock());
    body.appendChild(renderReservasBlock());
    body.appendChild(renderIdeasBlock());
  }

  function renderEventsBlock() {
    const card = document.createElement('div');
    card.className = 'hoy-card';
    card.innerHTML = `<div class="hoy-card-title"><span>📅 Hoy en tu agenda</span></div>`;

    const events = eventsToday();
    if (events.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'hoy-empty';
      empty.textContent = 'Sin eventos para hoy. Día libre.';
      card.appendChild(empty);
      return card;
    }

    events.forEach((e) => {
      const row = document.createElement('div');
      row.className = 'hoy-event';
      const time = e.start ? `${e.start}${e.end ? ' – ' + e.end : ''}` : 'Todo el día';
      row.innerHTML = `
        <span class="hoy-event-time">${time}</span>
        <span class="hoy-event-title">${escapeHtml(e.title)}</span>
      `;
      row.addEventListener('click', () => {
        window.app.switchView('calendar');
        setTimeout(() => window.calendar.refresh(), 50);
      });
      card.appendChild(row);
    });

    return card;
  }

  function renderReservasBlock() {
    const card = document.createElement('div');
    card.className = 'hoy-card';
    card.innerHTML = `<div class="hoy-card-title"><span>🏠 Próximas reservas</span></div>`;

    const list = nextReservas();
    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'hoy-empty';
      empty.textContent = 'Sin reservas próximas.';
      card.appendChild(empty);
      return card;
    }

    list.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'hoy-reserva ' + (r.platform || '');
      const dUntil = daysUntil(r.checkin);
      const when =
        dUntil === 0 ? 'Hoy' :
        dUntil === 1 ? 'Mañana' :
        dUntil < 0 ? 'En curso' :
        `En ${dUntil} días`;
      row.innerHTML = `
        <div class="hoy-reserva-left">
          <div class="hoy-reserva-platform">${PLATFORM_LABEL[r.platform] || ''}</div>
          <div class="hoy-reserva-guest">${escapeHtml(r.guest || '(sin huésped)')}</div>
          <div class="hoy-reserva-dates">${fmtDateShort(r.checkin)} → ${fmtDateShort(r.checkout)}</div>
        </div>
        <div class="hoy-reserva-right">
          <div class="hoy-reserva-when">${when}</div>
          <div class="hoy-reserva-amount">${fmt$(r.amount)}</div>
        </div>
      `;
      row.addEventListener('click', () => {
        window.app.switchView('reservas');
        setTimeout(() => window.reservas.openEdit(r.id), 150);
      });
      card.appendChild(row);
    });

    return card;
  }

  function renderIdeasBlock() {
    const card = document.createElement('div');
    card.className = 'hoy-card';
    card.innerHTML = `<div class="hoy-card-title"><span>💡 Ideas recientes</span></div>`;

    const list = recentIdeas();
    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'hoy-empty';
      empty.textContent = 'Sin ideas todavía.';
      card.appendChild(empty);
      return card;
    }

    list.forEach((i) => {
      const row = document.createElement('div');
      row.className = 'hoy-idea';
      row.innerHTML = `<span class="hoy-idea-dot"></span><span>${escapeHtml(i.title || '(sin título)')}</span>`;
      row.addEventListener('click', () => window.app.switchView('ideas'));
      card.appendChild(row);
    });

    return card;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function init() {
    document.getElementById('hoy-new').addEventListener('click', () => {
      window.calendar.openNewAt();
    });
    render();
  }

  window.hoy = { init, render };
})();
