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
