import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  isElectron,
  isCapacitorNative,
  isNativePlatform,
  convertFileSrc,
} from './platform';

/**
 * Request photo library permissions.
 * - Electron: macOS file dialog grants access per-pick via the system Open Panel,
 *   so no separate permission step is required.
 * - Capacitor: prompts the OS for photo library access.
 */
export const requestPhotoPermissions = async () => {
  if (isElectron()) return true;
  try {
    const permission = await Camera.requestPermissions({ permissions: ['photos'] });
    return permission.photos === 'granted' || permission.photos === 'limited';
  } catch (error) {
    console.error('Error requesting photo permissions:', error);
    return false;
  }
};

/**
 * Check whether photo library access is currently granted.
 */
export const checkPhotoPermissions = async () => {
  if (isElectron()) return true;
  try {
    const permission = await Camera.checkPermissions();
    return permission.photos === 'granted' || permission.photos === 'limited';
  } catch (error) {
    console.error('Error checking photo permissions:', error);
    return false;
  }
};

/**
 * Pick multiple photos from the device library.
 *
 * Dispatches to the appropriate native bridge:
 * - Electron (macOS): `dialog.showOpenDialog` via IPC, returns photos with a
 *   `pgg-media://` webPath that the renderer can load directly.
 * - Capacitor (iOS / Android): `Camera.pickImages` from the photo library.
 *
 * @param {number} limit - Maximum number of photos to select.
 * @returns {Promise<Array<{id: string, uri: string, webPath: string, path: string, date: null, location: null}>>}
 */
export const pickPhotosFromLibrary = async (limit = 30) => {
  if (isElectron()) {
    return window.electronAPI.photos.pick({ limit });
  }

  if (!isCapacitorNative()) {
    throw new Error('Photo picker is only available on native platforms');
  }

  const hasPermission = await requestPhotoPermissions();
  if (!hasPermission) {
    throw new Error('Photo library permission denied. Please grant access in Settings.');
  }

  try {
    const result = await Camera.pickImages({ quality: 90, limit });
    if (!result.photos || result.photos.length === 0) return [];

    return result.photos.map((photo, index) => ({
      id: `native-photo-${Date.now()}-${index}`,
      uri: photo.path || '',
      webPath: photo.webPath || '',
      path: photo.path || '',
      date: null,
      location: null,
    }));
  } catch (error) {
    if (error.message?.includes('User cancelled')) return [];
    throw error;
  }
};

/**
 * Pick a single photo from the library.
 * On Electron this still uses the multi-select dialog but caps at one result.
 */
export const pickSinglePhoto = async () => {
  if (isElectron()) {
    const photos = await window.electronAPI.photos.pick({ limit: 1 });
    return photos[0] ?? null;
  }

  if (!isCapacitorNative()) {
    throw new Error('Photo picker is only available on native platforms');
  }

  const hasPermission = await requestPhotoPermissions();
  if (!hasPermission) {
    throw new Error('Photo library permission denied');
  }

  try {
    const result = await Camera.getPhoto({
      quality: 90,
      source: CameraSource.Photos,
      resultType: CameraResultType.Uri,
    });

    if (!result) return null;

    return {
      id: `native-photo-${Date.now()}`,
      uri: result.path || '',
      webPath: result.webPath || '',
      path: result.path || '',
      date: null,
      location: null,
    };
  } catch (error) {
    if (error.message?.includes('User cancelled')) return null;
    throw error;
  }
};

/**
 * Resolve a renderer-loadable URL for a photo across web, Capacitor, and Electron.
 */
export const getPhotoUrl = (photo) => {
  if (!photo) return '';

  // Web (browser-served manifest URLs)
  if (!isNativePlatform()) {
    return photo.url || photo.webPath || '';
  }

  // Native shells (Capacitor or Electron): webPath is pre-rewritten by the picker
  if (photo.webPath) return photo.webPath;
  if (photo.uri) return convertFileSrc(photo.uri);
  if (photo.path) return convertFileSrc(photo.path);
  return photo.url || '';
};
