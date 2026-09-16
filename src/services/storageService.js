import { Preferences } from '@capacitor/preferences';
import { isElectron, isCapacitorNative } from './platform';

/**
 * Cross-platform key-value storage.
 * - Electron: persisted JSON file in app.getPath('userData') via IPC
 * - Capacitor iOS/Android: Preferences (NSUserDefaults / SharedPreferences)
 * - Web: localStorage
 */

export const getItem = async (key) => {
  if (isElectron()) {
    return window.electronAPI.storage.get(key);
  }
  if (isCapacitorNative()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
};

export const setItem = async (key, value) => {
  if (isElectron()) {
    await window.electronAPI.storage.set(key, value);
    return;
  }
  if (isCapacitorNative()) {
    await Preferences.set({ key, value });
    return;
  }
  localStorage.setItem(key, value);
};

export const removeItem = async (key) => {
  if (isElectron()) {
    await window.electronAPI.storage.remove(key);
    return;
  }
  if (isCapacitorNative()) {
    await Preferences.remove({ key });
    return;
  }
  localStorage.removeItem(key);
};

export const clear = async () => {
  if (isElectron()) {
    await window.electronAPI.storage.clear();
    return;
  }
  if (isCapacitorNative()) {
    await Preferences.clear();
    return;
  }
  localStorage.clear();
};

export const keys = async () => {
  if (isElectron()) {
    return window.electronAPI.storage.keys();
  }
  if (isCapacitorNative()) {
    const { keys: storageKeys } = await Preferences.keys();
    return storageKeys;
  }
  return Object.keys(localStorage);
};

/**
 * Zustand persist storage adapter.
 */
export const createCrossplatformStorage = () => ({
  getItem: async (name) => await getItem(name),
  setItem: async (name, value) => await setItem(name, value),
  removeItem: async (name) => await removeItem(name),
});
