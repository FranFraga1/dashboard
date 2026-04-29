// storage.js — wrapper único de persistencia.
// MVP: localStorage. Para empaquetar con Tauri, reemplazar este archivo
// por una versión que use @tauri-apps/api/fs o tauri-plugin-sql.

(function () {
  const PREFIX = 'dashboard.';

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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

  function makeCollection(key) {
    return {
      list() {
        return read(key);
      },
      get(id) {
        return read(key).find((x) => x.id === id) || null;
      },
      add(obj) {
        const items = read(key);
        const item = { id: uid(), createdAt: Date.now(), ...obj };
        items.push(item);
        write(key, items);
        return item;
      },
      update(id, patch) {
        const items = read(key);
        const idx = items.findIndex((x) => x.id === id);
        if (idx === -1) return null;
        items[idx] = { ...items[idx], ...patch, updatedAt: Date.now() };
        write(key, items);
        return items[idx];
      },
      remove(id) {
        const items = read(key).filter((x) => x.id !== id);
        write(key, items);
      },
      replaceAll(arr) {
        write(key, Array.isArray(arr) ? arr : []);
      },
    };
  }

  const storage = {
    events: makeCollection('events'),
    ideas: makeCollection('ideas'),
    reservas: makeCollection('reservas'),

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
    },

    clearAll() {
      write('events', []);
      write('ideas', []);
      write('reservas', []);
    },
  };

  window.storage = storage;
})();
