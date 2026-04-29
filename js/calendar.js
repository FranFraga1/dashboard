// calendar.js — vista calendario (mes/semana/día) + drag-drop
// API pública: window.calendar = { render(), refresh(), goToToday(), nav(delta), setMode(mode), openNewAt(date) }

(function () {
  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const DIAS_LARGOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  let mode = 'month'; // 'month' | 'week' | 'day'
  let cursor = startOfDay(new Date());

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseYmd(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function sameDay(a, b) {
    return ymd(a) === ymd(b);
  }

  // Lunes-first: índice 0 = lunes
  function dayIndex(d) {
    return (d.getDay() + 6) % 7;
  }

  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function startOfMonthGrid(date) {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    return addDays(first, -dayIndex(first));
  }

  function startOfWeek(date) {
    return addDays(date, -dayIndex(date));
  }

  // Obtener todas las "tarjetas" para una fecha: eventos directos + reservas que la cubren
  function itemsForDate(date) {
    const key = ymd(date);
    const events = storage.events.list().filter((e) => e.date === key);
    const reservas = storage.reservas
      .list()
      .filter((r) => r.status !== 'cancelada' && r.checkin && r.checkout)
      .filter((r) => key >= r.checkin && key < r.checkout)
      .map((r) => ({
        id: 'r-' + r.id,
        title: `${r.guest || 'Reserva'} — ${r.property || ''}`.trim(),
        date: key,
        isReserva: true,
        reservaId: r.id,
        platform: r.platform || '',
      }));
    return [...reservas, ...events];
  }

  function format$(n) {
    if (!n) return '$0';
    return '$' + Number(n).toLocaleString('es-AR');
  }

  function monthLabel() {
    if (mode === 'month') {
      return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    }
    if (mode === 'week') {
      const start = startOfWeek(cursor);
      const end = addDays(start, 6);
      const sm = MESES[start.getMonth()].slice(0, 3);
      const em = MESES[end.getMonth()].slice(0, 3);
      return `${start.getDate()} ${sm} – ${end.getDate()} ${em} ${end.getFullYear()}`;
    }
    return `${DIAS_LARGOS[dayIndex(cursor)]} ${cursor.getDate()} ${MESES[cursor.getMonth()]}`;
  }

  function render() {
    document.getElementById('cal-month-label').textContent = monthLabel();

    document.querySelectorAll('#cal-toggle button').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    const body = document.getElementById('cal-body');
    body.innerHTML = '';

    if (mode === 'month') renderMonth(body);
    else if (mode === 'week') renderList(body, 7, startOfWeek(cursor));
    else renderList(body, 1, cursor);
  }

  function renderMonth(root) {
    const wrap = document.createElement('div');
    wrap.className = 'cal-month';

    const wd = document.createElement('div');
    wd.className = 'cal-weekdays';
    DIAS_CORTOS.forEach((d) => {
      const el = document.createElement('div');
      el.className = 'cal-weekday';
      el.textContent = d;
      wd.appendChild(el);
    });
    wrap.appendChild(wd);

    const grid = document.createElement('div');
    grid.className = 'cal-grid';

    const start = startOfMonthGrid(cursor);
    const today = startOfDay(new Date());
    const monthIdx = cursor.getMonth();

    for (let i = 0; i < 42; i++) {
      const day = addDays(start, i);
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      if (day.getMonth() !== monthIdx) cell.classList.add('muted');
      if (sameDay(day, today)) cell.classList.add('today');
      cell.dataset.date = ymd(day);

      const num = document.createElement('span');
      num.className = 'cal-cell-num';
      num.textContent = day.getDate();
      cell.appendChild(num);

      const items = itemsForDate(day);
      const max = 3;
      items.slice(0, max).forEach((it) => {
        cell.appendChild(renderEventChip(it));
      });
      if (items.length > max) {
        const more = document.createElement('div');
        more.className = 'cal-more';
        more.textContent = `+${items.length - max} más`;
        cell.appendChild(more);
      }

      attachCellHandlers(cell);
      grid.appendChild(cell);
    }
    wrap.appendChild(grid);
    root.appendChild(wrap);
  }

  function renderList(root, days, start) {
    const wrap = document.createElement('div');
    wrap.className = 'cal-list';
    const today = startOfDay(new Date());

    for (let i = 0; i < days; i++) {
      const day = addDays(start, i);
      const block = document.createElement('div');
      block.className = 'cal-list-day';
      block.dataset.date = ymd(day);
      if (sameDay(day, today)) block.classList.add('today');

      const date = document.createElement('div');
      date.className = 'cal-list-date';
      date.textContent = `${DIAS_LARGOS[dayIndex(day)]} ${day.getDate()} ${MESES[day.getMonth()]}`;
      block.appendChild(date);

      const items = itemsForDate(day);
      if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'cal-list-empty';
        empty.textContent = 'Sin eventos. Click acá para agendar.';
        block.appendChild(empty);
      } else {
        items.forEach((it) => {
          const row = document.createElement('div');
          row.className =
            'cal-list-event' +
            (it.isReserva ? ' reserva' : '') +
            (it.isReserva && it.platform ? ' ' + it.platform : '');
          row.dataset.eventId = it.isReserva ? '' : it.id;
          row.dataset.reservaId = it.isReserva ? it.reservaId : '';

          const time = document.createElement('div');
          time.className = 'cal-list-event-time';
          time.textContent = it.isReserva
            ? 'Todo el día'
            : (it.start || '') + (it.end ? ' – ' + it.end : '');
          row.appendChild(time);

          const title = document.createElement('div');
          title.textContent = it.title;
          row.appendChild(title);

          row.addEventListener('click', (e) => {
            e.stopPropagation();
            if (it.isReserva) {
              window.app.switchView('reservas');
              setTimeout(() => window.reservas.openEdit(it.reservaId), 150);
            } else {
              openEventModal(it);
            }
          });

          block.appendChild(row);
        });
      }

      block.addEventListener('click', () => {
        openEventModal(null, ymd(day));
      });

      wrap.appendChild(block);
    }

    root.appendChild(wrap);
  }

  function renderEventChip(item) {
    const chip = document.createElement('div');
    chip.className =
      'cal-event' +
      (item.isReserva ? ' reserva' : '') +
      (item.isReserva && item.platform ? ' ' + item.platform : '');
    chip.textContent = item.title || '(sin título)';
    chip.title = item.title;

    if (item.isReserva) {
      chip.draggable = false;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        window.app.switchView('reservas');
        setTimeout(() => window.reservas.openEdit(item.reservaId), 150);
      });
    } else {
      chip.draggable = true;
      chip.dataset.id = item.id;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        openEventModal(item);
      });
      chip.addEventListener('dragstart', (e) => {
        chip.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
      });
      chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
    }
    return chip;
  }

  function attachCellHandlers(cell) {
    cell.addEventListener('click', (e) => {
      if (e.target === cell || e.target.classList.contains('cal-cell-num')) {
        openEventModal(null, cell.dataset.date);
      }
    });
    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      cell.classList.add('drop-target');
    });
    cell.addEventListener('dragleave', () => cell.classList.remove('drop-target'));
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('drop-target');
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      storage.events.update(id, { date: cell.dataset.date });
      render();
      window.app.toast('Movido');
    });
  }

  // ===== Modal evento =====

  function openEventModal(event, defaultDate) {
    const modal = document.getElementById('modal-event');
    const title = document.getElementById('event-modal-title');
    const idEl = document.getElementById('event-id');
    const titleEl = document.getElementById('event-title');
    const dateEl = document.getElementById('event-date');
    const startEl = document.getElementById('event-start');
    const endEl = document.getElementById('event-end');
    const noteEl = document.getElementById('event-note');
    const delBtn = document.getElementById('event-delete');

    if (event) {
      title.textContent = 'Editar tarea';
      idEl.value = event.id;
      titleEl.value = event.title || '';
      dateEl.value = event.date || '';
      startEl.value = event.start || '';
      endEl.value = event.end || '';
      noteEl.value = event.note || '';
      delBtn.style.display = '';
    } else {
      title.textContent = 'Nueva tarea';
      idEl.value = '';
      titleEl.value = '';
      dateEl.value = defaultDate || ymd(new Date());
      startEl.value = '';
      endEl.value = '';
      noteEl.value = '';
      delBtn.style.display = 'none';
    }
    window.app.openModal(modal);
    setTimeout(() => titleEl.focus(), 50);
  }

  function saveEventModal() {
    const id = document.getElementById('event-id').value;
    const data = {
      title: document.getElementById('event-title').value.trim(),
      date: document.getElementById('event-date').value,
      start: document.getElementById('event-start').value,
      end: document.getElementById('event-end').value,
      note: document.getElementById('event-note').value.trim(),
    };
    if (!data.title) {
      window.app.toast('Falta el título');
      return;
    }
    if (!data.date) {
      window.app.toast('Falta la fecha');
      return;
    }
    if (id) storage.events.update(id, data);
    else storage.events.add(data);

    window.app.closeModal(document.getElementById('modal-event'));
    render();
    if (window.hoy) window.hoy.render();
    window.app.toast(id ? 'Actualizado' : 'Guardado');
  }

  function deleteEventModal() {
    const id = document.getElementById('event-id').value;
    if (!id) return;
    if (!confirm('¿Eliminar esta tarea?')) return;
    storage.events.remove(id);
    window.app.closeModal(document.getElementById('modal-event'));
    render();
    if (window.hoy) window.hoy.render();
    window.app.toast('Eliminada');
  }

  // ===== API pública + bindings =====

  function init() {
    document.getElementById('cal-prev').addEventListener('click', () => nav(-1));
    document.getElementById('cal-next').addEventListener('click', () => nav(1));
    document.getElementById('cal-today').addEventListener('click', goToToday);

    document.querySelectorAll('#cal-toggle button').forEach((b) => {
      b.addEventListener('click', () => setMode(b.dataset.mode));
    });

    document.getElementById('event-save').addEventListener('click', saveEventModal);
    document.getElementById('event-delete').addEventListener('click', deleteEventModal);

    document.getElementById('event-title').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEventModal();
    });

    render();
  }

  function nav(delta) {
    if (mode === 'month') {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    } else if (mode === 'week') {
      cursor = addDays(cursor, 7 * delta);
    } else {
      cursor = addDays(cursor, delta);
    }
    render();
  }

  function goToToday() {
    cursor = startOfDay(new Date());
    render();
  }

  function setMode(m) {
    mode = m;
    render();
  }

  function openNewAt(date) {
    openEventModal(null, date || ymd(new Date()));
  }

  window.calendar = {
    init,
    render,
    refresh: render,
    nav,
    goToToday,
    setMode,
    openNewAt,
  };
})();
