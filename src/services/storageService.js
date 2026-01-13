import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './platform';

/**
 * Cross-platform storage service
 * Uses Capacitor Preferences on native, localStorage on web
 */

/**
 * Get an item from storage
 * @param {string} key
 * @returns {Promise<string | null>}
 */
export const getItem = async (key) => {
  if (isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
};

/**
 * Set an item in storage
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 */
export const setItem = async (key, value) => {
  if (isNativePlatform()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
};

/**
 * Remove an item from storage
 * @param {string} key
 * @returns {Promise<void>}
 */
export const removeItem = async (key) => {
  if (isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
};

/**
 * Clear all items from storage
 * @returns {Promise<void>}
 */
export const clear = async () => {
  if (isNativePlatform()) {
    await Preferences.clear();
  } else {
    localStorage.clear();
  }
};

/**
 * Get all keys in storage
 * @returns {Promise<string[]>}
 */
export const keys = async () => {
  if (isNativePlatform()) {
    const { keys: storageKeys } = await Preferences.keys();
    return storageKeys;
  }
  return Object.keys(localStorage);
};

/**
 * Create a Zustand storage adapter for cross-platform persistence
 * @returns {object} Storage adapter compatible with Zustand persist middleware
 */
export const createCrossplatformStorage = () => {
  return {
    getItem: async (name) => {
      const value = await getItem(name);
      return value;
    },
    setItem: async (name, value) => {
      await setItem(name, value);
    },
    removeItem: async (name) => {
      await removeItem(name);
    },
  };
};
