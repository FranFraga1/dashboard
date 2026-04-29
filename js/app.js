// app.js — bootstrap, router de vistas, atajos, modal manager, settings
// API pública: window.app = { switchView, openModal, closeModal, toast }

(function () {
  let currentView = 'hoy';
  let openModalEl = null;

  function switchView(name) {
    currentView = name;
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById('view-' + name).classList.add('active');
    document.querySelectorAll('.nav-item[data-view]').forEach((n) => {
      n.classList.toggle('active', n.dataset.view === name);
    });
    if (name === 'hoy') window.hoy.render();
    if (name === 'calendar') window.calendar.refresh();
    if (name === 'ideas') window.ideas.render();
    if (name === 'reservas') window.reservas.render();
    if (name === 'metricas') window.metricas.render();
  }

  function openModal(el) {
    if (openModalEl) closeModal(openModalEl);
    el.classList.add('open');
    openModalEl = el;
  }

  function closeModal(el) {
    el.classList.remove('open');
    if (openModalEl === el) openModalEl = null;
  }

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function isTypingTarget(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
  }

  function handleNew() {
    if (currentView === 'calendar' || currentView === 'hoy') window.calendar.openNewAt();
    else if (currentView === 'ideas') window.ideas.focusInput();
    else if (currentView === 'reservas') window.reservas.openNew();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (icon) icon.textContent = theme === 'light' ? '☀' : '☾';
    if (label) label.textContent = theme === 'light' ? 'Claro' : 'Oscuro';
    localStorage.setItem('dashboard.theme', theme);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return; // no aplica al abrir con doble click
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('SW registration failed', err);
    });
  }

  // ===== Swipe horizontal entre vistas y para navegar el calendario =====

  const VIEWS_ORDER = ['hoy', 'calendar', 'ideas', 'reservas', 'metricas'];

  function attachSwipe(el, onLeft, onRight) {
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let tracking = false;

    el.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length !== 1) {
          tracking = false;
          return;
        }
        // Si el touch arranca dentro de un input/textarea/select/botón scrolleable, ignoramos
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          tracking = false;
          return;
        }
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
        tracking = true;
      },
      { passive: true }
    );

    el.addEventListener(
      'touchend',
      (e) => {
        if (!tracking) return;
        tracking = false;
        if (e.changedTouches.length !== 1) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        const dt = Date.now() - startTime;
        if (dt > 600) return; // demasiado lento para considerar swipe
        if (Math.abs(dx) < 60) return; // movimiento muy chico
        if (Math.abs(dy) > Math.abs(dx) * 0.7) return; // más vertical que horizontal: probablemente scroll
        if (dx < 0) onLeft && onLeft();
        else onRight && onRight();
      },
      { passive: true }
    );
  }

  function switchToAdjacent(delta) {
    const idx = VIEWS_ORDER.indexOf(currentView);
    if (idx === -1) return;
    const next = idx + delta;
    if (next < 0 || next >= VIEWS_ORDER.length) return;
    switchView(VIEWS_ORDER[next]);
  }

  function bindSwipes() {
    // Swipe horizontal en TODAS las vistas (incluido calendario) cambia de sección.
    // Para navegar mes/semana/día están los botones ‹ › del header del calendario.
    VIEWS_ORDER.forEach((view) => {
      const id = 'view-' + (view === 'calendar' ? 'calendar' : view);
      attachSwipe(
        document.getElementById(id),
        () => switchToAdjacent(1),
        () => switchToAdjacent(-1)
      );
    });
  }

  function bindMoreMenu() {
    const btn = document.getElementById('btn-more');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const existing = document.querySelector('.more-menu');
      if (existing) {
        existing.remove();
        return;
      }

      const menu = document.createElement('div');
      menu.className = 'settings-menu more-menu';

      // Cuenta
      const accountSection = document.createElement('div');
      accountSection.className = 'more-section';
      accountSection.textContent = 'Cuenta';
      menu.appendChild(accountSection);

      const accountBtn = document.createElement('button');
      const user = window.auth && window.auth.getUser ? window.auth.getUser() : null;
      if (user) {
        accountBtn.innerHTML = `<span>●</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.email}</span>`;
      } else {
        accountBtn.innerHTML = `<span>○</span><span>Iniciar sesión</span>`;
      }
      accountBtn.addEventListener('click', () => {
        menu.remove();
        document.getElementById('btn-auth').click();
      });
      menu.appendChild(accountBtn);

      if (user && window.sync) {
        const syncBtn = document.createElement('button');
        syncBtn.innerHTML = '<span>↻</span><span>Sincronizar ahora</span>';
        syncBtn.addEventListener('click', async () => {
          menu.remove();
          await window.sync.fullSync();
        });
        menu.appendChild(syncBtn);

        const outBtn = document.createElement('button');
        outBtn.className = 'danger';
        outBtn.innerHTML = '<span>↪</span><span>Cerrar sesión</span>';
        outBtn.addEventListener('click', async () => {
          menu.remove();
          if (!confirm('¿Cerrar sesión? Los datos quedan en este dispositivo.')) return;
          await window.auth.signOut();
        });
        menu.appendChild(outBtn);
      }

      menu.appendChild(divider());

      // Tema
      const themeBtn = document.createElement('button');
      const isDark =
        (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
      themeBtn.innerHTML = isDark
        ? '<span>☀</span><span>Tema claro</span>'
        : '<span>☾</span><span>Tema oscuro</span>';
      themeBtn.addEventListener('click', () => {
        menu.remove();
        document.getElementById('btn-theme').click();
      });
      menu.appendChild(themeBtn);

      menu.appendChild(divider());

      // Datos
      const dataSection = document.createElement('div');
      dataSection.className = 'more-section';
      dataSection.textContent = 'Datos';
      menu.appendChild(dataSection);

      const exportBtn = document.createElement('button');
      exportBtn.innerHTML = '<span>↓</span><span>Exportar JSON</span>';
      exportBtn.addEventListener('click', () => {
        menu.remove();
        const data = storage.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Backup descargado');
      });
      menu.appendChild(exportBtn);

      const importBtn = document.createElement('button');
      importBtn.innerHTML = '<span>↑</span><span>Importar JSON</span>';
      importBtn.addEventListener('click', () => {
        menu.remove();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.addEventListener('change', () => {
          const file = input.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const data = JSON.parse(reader.result);
              storage.importAll(data);
              rerenderAll();
              toast('Datos importados');
            } catch (err) {
              alert('JSON inválido: ' + err.message);
            }
          };
          reader.readAsText(file);
        });
        input.click();
      });
      menu.appendChild(importBtn);

      const clearBtn = document.createElement('button');
      clearBtn.className = 'danger';
      clearBtn.innerHTML = '<span>✕</span><span>Borrar todo</span>';
      clearBtn.addEventListener('click', () => {
        menu.remove();
        if (
          confirm(
            'Esto borra eventos, ideas y reservas de este dispositivo. ¿Seguir?\n\n(Conviene exportar antes.)'
          )
        ) {
          storage.clearAll();
          rerenderAll();
          toast('Todo borrado');
        }
      });
      menu.appendChild(clearBtn);

      const rect = btn.getBoundingClientRect();
      menu.style.left = rect.left + 'px';
      menu.style.bottom = window.innerHeight - rect.top + 8 + 'px';
      document.body.appendChild(menu);

      const closeOnOutside = (ev) => {
        if (!menu.contains(ev.target) && !btn.contains(ev.target)) {
          menu.remove();
          document.removeEventListener('click', closeOnOutside);
        }
      };
      setTimeout(() => document.addEventListener('click', closeOnOutside), 0);
    });
  }

  function divider() {
    const d = document.createElement('div');
    d.className = 'more-divider';
    return d;
  }

  function bindTheme() {
    const saved = localStorage.getItem('dashboard.theme') || 'dark';
    applyTheme(saved);
    document.getElementById('btn-theme').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  function bindShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Esc cierra modal siempre
      if (e.key === 'Escape' && openModalEl) {
        closeModal(openModalEl);
        return;
      }

      if (isTypingTarget(e)) {
        // mientras escribís, solo dejamos pasar Esc (manejado arriba)
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case '0':
          switchView('hoy');
          break;
        case '1':
          switchView('calendar');
          break;
        case '2':
          switchView('ideas');
          break;
        case '3':
          switchView('reservas');
          break;
        case '4':
          switchView('metricas');
          break;
        case 'n':
        case 'N':
          handleNew();
          e.preventDefault();
          break;
        case 't':
        case 'T':
          if (currentView === 'calendar') window.calendar.goToToday();
          break;
        case 'ArrowLeft':
          if (currentView === 'calendar') window.calendar.nav(-1);
          break;
        case 'ArrowRight':
          if (currentView === 'calendar') window.calendar.nav(1);
          break;
        case '/':
          if (currentView === 'ideas') {
            document.getElementById('idea-search').focus();
            e.preventDefault();
          }
          break;
      }
    });
  }

  function bindNav() {
    document.querySelectorAll('.nav-item[data-view]').forEach((n) => {
      n.addEventListener('click', () => switchView(n.dataset.view));
    });

    document.getElementById('cta-new').addEventListener('click', handleNew);
    const fab = document.getElementById('fab-new');
    if (fab) fab.addEventListener('click', handleNew);

    document.querySelectorAll('[data-close]').forEach((b) => {
      b.addEventListener('click', () => {
        const m = b.closest('.modal-backdrop');
        if (m) closeModal(m);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach((m) => {
      m.addEventListener('click', (e) => {
        if (e.target === m) closeModal(m);
      });
    });
  }

  function bindSettings() {
    const btn = document.getElementById('btn-settings');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const existing = document.querySelector('.settings-menu');
      if (existing) {
        existing.remove();
        return;
      }

      const menu = document.createElement('div');
      menu.className = 'settings-menu';

      const exportBtn = document.createElement('button');
      exportBtn.textContent = '↓ Exportar JSON';
      exportBtn.addEventListener('click', () => {
        const data = storage.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        menu.remove();
        toast('Backup descargado');
      });

      const importBtn = document.createElement('button');
      importBtn.textContent = '↑ Importar JSON';
      importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.addEventListener('change', () => {
          const file = input.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const data = JSON.parse(reader.result);
              storage.importAll(data);
              window.calendar.refresh();
              window.ideas.render();
              window.reservas.render();
              toast('Datos importados');
            } catch (err) {
              alert('JSON inválido: ' + err.message);
            }
          };
          reader.readAsText(file);
        });
        input.click();
        menu.remove();
      });

      const clearBtn = document.createElement('button');
      clearBtn.className = 'danger';
      clearBtn.textContent = '✕ Borrar todo';
      clearBtn.addEventListener('click', () => {
        if (
          confirm(
            'Esto borra eventos, ideas y reservas. ¿Seguir?\n\n(Conviene exportar antes.)'
          )
        ) {
          storage.clearAll();
          window.calendar.refresh();
          window.ideas.render();
          window.reservas.render();
          toast('Todo borrado');
        }
        menu.remove();
      });

      menu.appendChild(exportBtn);
      menu.appendChild(importBtn);
      menu.appendChild(clearBtn);

      const rect = btn.getBoundingClientRect();
      menu.style.left = rect.right + 8 + 'px';
      menu.style.bottom = window.innerHeight - rect.bottom + 'px';
      document.body.appendChild(menu);

      const closeOnOutside = (ev) => {
        if (!menu.contains(ev.target)) {
          menu.remove();
          document.removeEventListener('click', closeOnOutside);
        }
      };
      setTimeout(() => document.addEventListener('click', closeOnOutside), 0);
    });
  }

  function rerenderAll() {
    if (window.hoy) window.hoy.render();
    if (window.calendar) window.calendar.refresh();
    if (window.ideas) window.ideas.render();
    if (window.reservas) window.reservas.render();
    if (window.metricas) window.metricas.render();
  }

  function init() {
    window.app = { switchView, openModal, closeModal, toast, rerenderAll };
    bindNav();
    bindShortcuts();
    bindSettings();
    bindTheme();
    bindMoreMenu();
    bindSwipes();
    registerServiceWorker();
    window.hoy.init();
    window.calendar.init();
    window.ideas.init();
    window.reservas.init();
    window.metricas.init();

    // Re-render cuando el storage cambia (típicamente por pull de Supabase)
    if (window.storage && window.storage.subscribe) {
      window.storage.subscribe(() => rerenderAll());
    }

    // Auth + sync (solo si Supabase cargó)
    if (window.supabaseClient && window.auth && window.sync) {
      window.sync.init();
      window.auth.init();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
