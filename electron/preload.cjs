const { contextBridge, ipcRenderer } = require('electron');

const subscribe = (channel, cb) => {
  const listener = (_event, payload) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isMacOS: process.platform === 'darwin',
  versions: { ...process.versions },

  photos: {
    pick: (opts) => ipcRenderer.invoke('photos:pick', opts ?? {}),
  },

  storage: {
    get: (key) => ipcRenderer.invoke('storage:get', key),
    set: (key, value) => ipcRenderer.invoke('storage:set', { key, value }),
    remove: (key) => ipcRenderer.invoke('storage:remove', key),
    clear: () => ipcRenderer.invoke('storage:clear'),
    keys: () => ipcRenderer.invoke('storage:keys'),
  },

  haptics: {
    impact: (style) => ipcRenderer.invoke('haptics:impact', style),
    notification: (type) => ipcRenderer.invoke('haptics:notification', type),
    selection: () => ipcRenderer.invoke('haptics:selection'),
  },

  notify: (payload) => ipcRenderer.invoke('notify', payload ?? {}),

  dock: {
    bounce: (type) => ipcRenderer.invoke('dock:bounce', type),
    setBadge: (badge) => ipcRenderer.invoke('dock:badge', badge),
  },

  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    onChange: (cb) => subscribe('theme:update', cb),
  },

  menu: {
    onEvent: (cb) => {
      const unsubs = [
        subscribe('menu:new-game', () => cb('new-game')),
        subscribe('menu:select-photos', () => cb('select-photos')),
      ];
      return () => unsubs.forEach((fn) => fn());
    },
  },

  appInfo: () => ipcRenderer.invoke('app:info'),
});
