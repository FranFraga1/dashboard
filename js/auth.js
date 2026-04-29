// auth.js — login con magic link + manejo de sesión
// API pública: window.auth = { init, signIn, signOut, getUser, isAuthenticated, onChange }

(function () {
  const listeners = new Set();
  let currentSession = null;

  function emit() {
    listeners.forEach((fn) => {
      try { fn(currentSession); } catch (e) { console.warn(e); }
    });
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function getUser() {
    return currentSession && currentSession.user ? currentSession.user : null;
  }

  function isAuthenticated() {
    return !!getUser();
  }

  async function signIn(email) {
    if (!window.supabaseClient) throw new Error('Supabase no inicializado');
    const redirectTo =
      location.protocol === 'file:'
        ? 'http://localhost:8000'
        : location.origin + location.pathname;
    const { error } = await window.supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!window.supabaseClient) return;
    await window.supabaseClient.auth.signOut();
  }

  function updateUI() {
    const user = getUser();
    const label = document.getElementById('auth-label');
    const sublabel = document.getElementById('auth-sublabel');
    const icon = document.getElementById('auth-icon');
    const btn = document.getElementById('btn-auth');

    if (user) {
      if (label) label.textContent = 'Cuenta';
      if (sublabel) {
        sublabel.textContent = user.email;
        sublabel.style.display = '';
      }
      if (icon) icon.textContent = '●';
      if (btn) btn.classList.add('authed');
    } else {
      if (label) label.textContent = 'Iniciar sesión';
      if (sublabel) sublabel.style.display = 'none';
      if (icon) icon.textContent = '○';
      if (btn) btn.classList.remove('authed');
    }
  }

  // ===== Login modal =====

  function openLoginModal() {
    if (isAuthenticated()) {
      openAccountMenu();
      return;
    }
    const modal = document.getElementById('modal-auth');
    document.getElementById('auth-step-form').style.display = '';
    document.getElementById('auth-step-sent').style.display = 'none';
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-error').textContent = '';
    window.app.openModal(modal);
    setTimeout(() => document.getElementById('auth-email').focus(), 50);
  }

  async function submitLogin() {
    const emailEl = document.getElementById('auth-email');
    const errorEl = document.getElementById('auth-error');
    const btn = document.getElementById('auth-submit');
    const email = emailEl.value.trim();
    if (!email || !email.includes('@')) {
      errorEl.textContent = 'Ingresá un email válido';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Enviando…';
    errorEl.textContent = '';
    try {
      await signIn(email);
      document.getElementById('auth-step-form').style.display = 'none';
      document.getElementById('auth-step-sent').style.display = '';
      document.getElementById('auth-sent-email').textContent = email;
    } catch (err) {
      errorEl.textContent = err.message || 'Error al enviar el link';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviarme link';
    }
  }

  function openAccountMenu() {
    const existing = document.querySelector('.account-menu');
    if (existing) {
      existing.remove();
      return;
    }
    const menu = document.createElement('div');
    menu.className = 'settings-menu account-menu';

    const info = document.createElement('div');
    info.className = 'account-info';
    info.innerHTML = `<div class="account-email">${escapeHtml(getUser().email)}</div><div class="account-status">Conectado</div>`;
    menu.appendChild(info);

    const sync = document.createElement('button');
    sync.textContent = '↻ Sincronizar ahora';
    sync.addEventListener('click', async () => {
      menu.remove();
      if (window.sync) await window.sync.fullSync();
    });
    menu.appendChild(sync);

    const out = document.createElement('button');
    out.className = 'danger';
    out.textContent = '↪ Cerrar sesión';
    out.addEventListener('click', async () => {
      menu.remove();
      if (!confirm('¿Cerrar sesión? Los datos quedan en este dispositivo.')) return;
      await signOut();
    });
    menu.appendChild(out);

    const btn = document.getElementById('btn-auth');
    const rect = btn.getBoundingClientRect();
    menu.style.left = rect.right + 8 + 'px';
    menu.style.bottom = window.innerHeight - rect.bottom + 'px';
    document.body.appendChild(menu);

    const closeOnOutside = (ev) => {
      if (!menu.contains(ev.target) && ev.target.id !== 'btn-auth') {
        menu.remove();
        document.removeEventListener('click', closeOnOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', closeOnOutside), 0);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function init() {
    if (!window.supabaseClient) {
      updateUI();
      return;
    }

    const { data } = await window.supabaseClient.auth.getSession();
    currentSession = data.session || null;
    updateUI();
    emit();

    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      currentSession = session;
      updateUI();
      emit();
      if (event === 'SIGNED_IN') {
        window.app.toast('Sesión iniciada — ' + (session.user.email || ''));
      } else if (event === 'SIGNED_OUT') {
        window.app.toast('Sesión cerrada');
      }
    });

    document.getElementById('btn-auth').addEventListener('click', openLoginModal);
    document.getElementById('auth-submit').addEventListener('click', submitLogin);
    document.getElementById('auth-email').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitLogin();
    });
  }

  window.auth = { init, signIn, signOut, getUser, isAuthenticated, onChange };
})();
