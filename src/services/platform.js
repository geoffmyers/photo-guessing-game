import { Capacitor } from '@capacitor/core';

/**
 * Check if we're running on a native platform (iOS/Android)
 */
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform
 * @returns {'ios' | 'android' | 'web'}
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};

/**
 * Check if we're running on iOS
 */
export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if we're running on Android
 */
export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if we're running on the web
 */
export const isWeb = () => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Convert a native file path to a web-accessible URL
 * (Only needed on native platforms)
 */
export const convertFileSrc = (filePath) => {
  if (!filePath) return '';
  return Capacitor.convertFileSrc(filePath);
};
