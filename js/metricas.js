// metricas.js — métricas operativas a partir de reservas confirmadas
// API pública: window.metricas = { init, render, nav }

(function () {
  const MESES = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];

  let cursorYear = new Date().getFullYear();

  function fmt$(n) {
    if (!n) return '$0';
    return '$' + Math.round(Number(n)).toLocaleString('es-AR');
  }

  function pct(n) {
    return Math.round(n * 100) + '%';
  }

  function daysInMonth(year, monthIdx) {
    return new Date(year, monthIdx + 1, 0).getDate();
  }

  function daysInYear(year) {
    return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
  }

  // Convierte ymd a Date local (sin shift de timezone)
  function parseYmd(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Cuenta noches de una reserva que caen en un mes dado (year, monthIdx)
  function nightsInMonth(reserva, year, monthIdx) {
    if (!reserva.checkin || !reserva.checkout) return 0;
    const ci = parseYmd(reserva.checkin);
    const co = parseYmd(reserva.checkout);
    const monthStart = new Date(year, monthIdx, 1);
    const monthEnd = new Date(year, monthIdx + 1, 1);
    const start = ci > monthStart ? ci : monthStart;
    const end = co < monthEnd ? co : monthEnd;
    const ms = end - start;
    return ms > 0 ? Math.round(ms / 86400000) : 0;
  }

  function nightsInYear(reserva, year) {
    let total = 0;
    for (let m = 0; m < 12; m++) total += nightsInMonth(reserva, year, m);
    return total;
  }

  // Monto prorrateado por mes según noches en ese mes (mejor que cargarlo todo al check-in)
  function amountInMonth(reserva, year, monthIdx) {
    const total = Number(reserva.amount) || 0;
    if (!total) return 0;
    if (!reserva.checkin || !reserva.checkout) return 0;
    const ci = parseYmd(reserva.checkin);
    const co = parseYmd(reserva.checkout);
    const totalNights = Math.max(1, Math.round((co - ci) / 86400000));
    const nm = nightsInMonth(reserva, year, monthIdx);
    return (total / totalNights) * nm;
  }

  function buildStats(year) {
    const reservas = storage.reservas.list().filter((r) => r.status === 'confirmada');

    const monthly = [];
    for (let m = 0; m < 12; m++) {
      let nights = 0;
      let income = 0;
      let count = 0;
      reservas.forEach((r) => {
        const nm = nightsInMonth(r, year, m);
        if (nm > 0) {
          nights += nm;
          income += amountInMonth(r, year, m);
          // Una reserva cuenta para el mes donde inicia
          const ci = parseYmd(r.checkin);
          if (ci.getFullYear() === year && ci.getMonth() === m) count += 1;
        }
      });
      monthly.push({
        idx: m,
        nights,
        income,
        count,
        capacity: daysInMonth(year, m),
        occupancy: nights / daysInMonth(year, m),
      });
    }

    const totalNights = monthly.reduce((s, x) => s + x.nights, 0);
    const totalIncome = monthly.reduce((s, x) => s + x.income, 0);
    const totalCount = monthly.reduce((s, x) => s + x.count, 0);

    // Por plataforma
    const byPlatform = { airbnb: 0, booking: 0, directo: 0 };
    reservas.forEach((r) => {
      const inYear = nightsInYear(r, year);
      if (inYear === 0) return;
      const total = Number(r.amount) || 0;
      const totalNightsRes = Math.max(
        1,
        Math.round((parseYmd(r.checkout) - parseYmd(r.checkin)) / 86400000)
      );
      const yearShare = (total / totalNightsRes) * inYear;
      if (byPlatform[r.platform] !== undefined) byPlatform[r.platform] += yearShare;
    });

    const occupancy = totalNights / daysInYear(year);
    const adr = totalNights ? totalIncome / totalNights : 0; // promedio noche
    const avgPerReserva = totalCount ? totalIncome / totalCount : 0;

    let bestMonth = null;
    let worstMonth = null;
    monthly.forEach((m) => {
      if (m.income === 0) return;
      if (!bestMonth || m.income > bestMonth.income) bestMonth = m;
      if (!worstMonth || m.income < worstMonth.income) worstMonth = m;
    });

    return {
      monthly, totalNights, totalIncome, totalCount, byPlatform,
      occupancy, adr, avgPerReserva, bestMonth, worstMonth,
    };
  }

  function render() {
    document.getElementById('metricas-year-label').textContent = String(cursorYear);
    const body = document.getElementById('metricas-body');
    body.innerHTML = '';

    const s = buildStats(cursorYear);
    const prev = buildStats(cursorYear - 1);
    const yoy = prev.totalIncome ? (s.totalIncome - prev.totalIncome) / prev.totalIncome : null;

    if (s.totalCount === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerHTML = `<h3>Sin datos para ${cursorYear}</h3><div>Cargá reservas confirmadas para ver métricas</div>`;
      body.appendChild(empty);
      return;
    }

    // KPIs
    const kpis = document.createElement('div');
    kpis.className = 'metricas-kpis';
    kpis.appendChild(makeKpi('Ingresos del año', fmt$(s.totalIncome), yoy != null ? fmtYoy(yoy) : null, 'accent'));
    kpis.appendChild(makeKpi('Ocupación', pct(s.occupancy), `${s.totalNights} noches reservadas`));
    kpis.appendChild(makeKpi('Promedio por noche', fmt$(s.adr), 'ADR'));
    kpis.appendChild(makeKpi('Reservas', String(s.totalCount), `Promedio ${fmt$(s.avgPerReserva)} c/u`));
    body.appendChild(kpis);

    // Mejor / peor mes
    if (s.bestMonth || s.worstMonth) {
      const row = document.createElement('div');
      row.className = 'metricas-row-2';
      if (s.bestMonth) {
        row.appendChild(
          makeKpi(
            'Mejor mes',
            MESES[s.bestMonth.idx],
            `${fmt$(s.bestMonth.income)} · ${pct(s.bestMonth.occupancy)} ocupación`,
            'accent'
          )
        );
      }
      if (s.worstMonth && s.worstMonth.idx !== (s.bestMonth && s.bestMonth.idx)) {
        row.appendChild(
          makeKpi(
            'Mes más flojo',
            MESES[s.worstMonth.idx],
            `${fmt$(s.worstMonth.income)} · ${pct(s.worstMonth.occupancy)} ocupación`,
            'muted'
          )
        );
      }
      body.appendChild(row);
    }

    // Distribución por plataforma
    body.appendChild(renderPlatformChart(s));

    // Gráfico mensual
    body.appendChild(renderMonthlyChart(s));
  }

  function makeKpi(label, value, sub, tone) {
    const card = document.createElement('div');
    card.className = 'metricas-kpi ' + (tone || '');
    card.innerHTML = `
      <div class="metricas-kpi-label">${label}</div>
      <div class="metricas-kpi-value">${value}</div>
      ${sub ? `<div class="metricas-kpi-sub">${sub}</div>` : ''}
    `;
    return card;
  }

  function fmtYoy(v) {
    const sign = v >= 0 ? '+' : '';
    return `${sign}${Math.round(v * 100)}% vs año anterior`;
  }

  function renderPlatformChart(s) {
    const total = s.byPlatform.airbnb + s.byPlatform.booking + s.byPlatform.directo;
    const card = document.createElement('div');
    card.className = 'metricas-block';
    card.innerHTML = `<div class="metricas-block-title">Distribución por plataforma</div>`;

    if (total === 0) {
      const empty = document.createElement('div');
      empty.className = 'hoy-empty';
      empty.textContent = 'Sin ingresos este año.';
      card.appendChild(empty);
      return card;
    }

    const stack = document.createElement('div');
    stack.className = 'platform-stack';
    ['airbnb', 'booking', 'directo'].forEach((p) => {
      const v = s.byPlatform[p];
      if (v === 0) return;
      const seg = document.createElement('div');
      seg.className = 'platform-seg ' + p;
      seg.style.width = (v / total) * 100 + '%';
      seg.title = `${p}: ${fmt$(v)} (${pct(v / total)})`;
      stack.appendChild(seg);
    });
    card.appendChild(stack);

    const legend = document.createElement('div');
    legend.className = 'platform-legend';
    ['airbnb', 'booking', 'directo'].forEach((p) => {
      const v = s.byPlatform[p];
      const item = document.createElement('div');
      item.className = 'platform-legend-item';
      item.innerHTML = `
        <span class="platform-dot ${p}"></span>
        <span class="platform-name">${p}</span>
        <span class="platform-amount">${fmt$(v)}</span>
        <span class="platform-pct">${pct(v / total)}</span>
      `;
      legend.appendChild(item);
    });
    card.appendChild(legend);

    return card;
  }

  function renderMonthlyChart(s) {
    const card = document.createElement('div');
    card.className = 'metricas-block';
    card.innerHTML = `<div class="metricas-block-title">Ingresos por mes</div>`;

    const max = Math.max(1, ...s.monthly.map((m) => m.income));
    const chart = document.createElement('div');
    chart.className = 'monthly-chart';

    s.monthly.forEach((m) => {
      const col = document.createElement('div');
      col.className = 'monthly-col';
      const h = (m.income / max) * 100;
      col.innerHTML = `
        <div class="monthly-bar-wrap">
          <div class="monthly-bar" style="height: ${h}%"></div>
        </div>
        <div class="monthly-label">${MESES[m.idx]}</div>
      `;
      col.title = `${MESES[m.idx]}: ${fmt$(m.income)} · ${pct(m.occupancy)} ocupación`;
      chart.appendChild(col);
    });

    card.appendChild(chart);
    return card;
  }

  function nav(delta) {
    cursorYear += delta;
    render();
  }

  function init() {
    document.querySelectorAll('#metricas-year-toggle button[data-dir]').forEach((b) => {
      b.addEventListener('click', () => nav(parseInt(b.dataset.dir, 10)));
    });
    render();
  }

  window.metricas = { init, render, nav };
})();
