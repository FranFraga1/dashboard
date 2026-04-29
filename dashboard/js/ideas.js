// ideas.js — captura rápida + lista + buscador + edición inline
// API pública: window.ideas = { init, render, focusInput }

(function () {
  let query = '';
  let editingId = null;

  function fmtDate(ts) {
    const d = new Date(ts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - dayStart) / 86400000);
    const time = d.toTimeString().slice(0, 5);
    if (diffDays === 0) return `Hoy · ${time}`;
    if (diffDays === 1) return `Ayer · ${time}`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function render() {
    const list = document.getElementById('ideas-list');
    list.innerHTML = '';

    const all = storage.ideas.list().slice().sort((a, b) => b.createdAt - a.createdAt);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (i) =>
            (i.title || '').toLowerCase().includes(q) ||
            (i.body || '').toLowerCase().includes(q)
        )
      : all;

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerHTML = q
        ? '<h3>Sin resultados</h3><div>Probá con otra palabra</div>'
        : '<h3>Sin ideas todavía</h3><div>Capturá la primera arriba ↑</div>';
      list.appendChild(empty);
      return;
    }

    filtered.forEach((idea) => {
      list.appendChild(renderCard(idea));
    });
  }

  function renderCard(idea) {
    const card = document.createElement('div');
    card.className = 'idea-card';
    card.dataset.id = idea.id;

    if (editingId === idea.id) {
      card.classList.add('editing');
      const titleInput = document.createElement('input');
      titleInput.className = 'idea-edit-input';
      titleInput.value = idea.title || '';
      titleInput.placeholder = 'Título';

      const bodyInput = document.createElement('textarea');
      bodyInput.className = 'idea-edit-body';
      bodyInput.rows = 4;
      bodyInput.value = idea.body || '';
      bodyInput.placeholder = 'Detalles, links, contexto…';

      const actions = document.createElement('div');
      actions.className = 'idea-edit-actions';

      const del = document.createElement('button');
      del.className = 'btn btn-danger';
      del.textContent = 'Eliminar';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Eliminar esta idea?')) {
          storage.ideas.remove(idea.id);
          editingId = null;
          render();
          window.app.toast('Eliminada');
        }
      });

      const cancel = document.createElement('button');
      cancel.className = 'btn';
      cancel.textContent = 'Cancelar';
      cancel.addEventListener('click', (e) => {
        e.stopPropagation();
        editingId = null;
        render();
      });

      const save = document.createElement('button');
      save.className = 'btn btn-primary';
      save.textContent = 'Guardar';
      save.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = titleInput.value.trim();
        if (!t) {
          window.app.toast('Falta el título');
          return;
        }
        storage.ideas.update(idea.id, { title: t, body: bodyInput.value.trim() });
        editingId = null;
        render();
        window.app.toast('Guardada');
      });

      actions.appendChild(del);
      actions.appendChild(document.createElement('span')).style.flex = '1';
      actions.appendChild(cancel);
      actions.appendChild(save);

      card.appendChild(titleInput);
      card.appendChild(bodyInput);
      card.appendChild(actions);

      setTimeout(() => titleInput.focus(), 30);
    } else {
      const meta = document.createElement('div');
      meta.className = 'idea-meta';
      meta.textContent = fmtDate(idea.updatedAt || idea.createdAt);
      card.appendChild(meta);

      const title = document.createElement('div');
      title.className = 'idea-title';
      title.textContent = idea.title || '(sin título)';
      card.appendChild(title);

      if (idea.body) {
        const body = document.createElement('div');
        body.className = 'idea-body';
        body.textContent = idea.body;
        card.appendChild(body);
      }

      card.addEventListener('click', () => {
        editingId = idea.id;
        render();
      });
    }
    return card;
  }

  function focusInput() {
    const i = document.getElementById('idea-input');
    i.focus();
    i.select();
  }

  function init() {
    const input = document.getElementById('idea-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const v = input.value.trim();
        if (!v) return;
        storage.ideas.add({ title: v, body: '' });
        input.value = '';
        render();
        window.app.toast('Idea guardada');
      }
    });

    const search = document.getElementById('idea-search');
    search.addEventListener('input', () => {
      query = search.value;
      render();
    });

    render();
  }

  window.ideas = { init, render, focusInput };
})();
