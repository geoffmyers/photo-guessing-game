import { Capacitor } from '@capacitor/core';

/**
 * True when running inside the Electron renderer (macOS desktop app).
 */
export const isElectron = () => {
  return typeof window !== 'undefined' && !!window.electronAPI;
};

/**
 * True when running inside a Capacitor-wrapped native shell (iOS or Android).
 */
export const isCapacitorNative = () => {
  return Capacitor.isNativePlatform();
};

/**
 * True for any non-web shell — Capacitor iOS/Android or Electron macOS.
 * Components use this to decide between manifest-fetch and native picker flows.
 */
export const isNativePlatform = () => {
  return isElectron() || isCapacitorNative();
};

/**
 * Get the current platform identifier.
 * @returns {'ios' | 'android' | 'macos' | 'web'}
 */
export const getPlatform = () => {
  if (isElectron()) return 'macos';
  return Capacitor.getPlatform();
};

export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isMacOS = () => isElectron() && window.electronAPI?.isMacOS === true;
export const isWeb = () => !isNativePlatform();

/**
 * Convert a native file path to a renderer-loadable URL.
 * - Electron: uses the privileged `pgg-media://` protocol registered in main.cjs
 * - Capacitor: uses Capacitor.convertFileSrc
 * - Web: returns the path unchanged
 */
export const convertFileSrc = (filePath) => {
  if (!filePath) return '';
  if (isElectron()) {
    return `pgg-media://media/?p=${encodeURIComponent(filePath)}`;
  }
  return Capacitor.convertFileSrc(filePath);
};
