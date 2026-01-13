import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNativePlatform, convertFileSrc } from './platform';

/**
 * Request camera/photo library permissions
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export const requestPhotoPermissions = async () => {
  try {
    const permission = await Camera.requestPermissions({ permissions: ['photos'] });
    return permission.photos === 'granted' || permission.photos === 'limited';
  } catch (error) {
    console.error('Error requesting photo permissions:', error);
    return false;
  }
};

/**
 * Check if photo library permissions are granted
 * @returns {Promise<boolean>}
 */
export const checkPhotoPermissions = async () => {
  try {
    const permission = await Camera.checkPermissions();
    return permission.photos === 'granted' || permission.photos === 'limited';
  } catch (error) {
    console.error('Error checking photo permissions:', error);
    return false;
  }
};

/**
 * Pick multiple photos from the device library
 * @param {number} limit - Maximum number of photos to select
 * @returns {Promise<Array<{id: string, uri: string, webPath: string, path: string}>>}
 */
export const pickPhotosFromLibrary = async (limit = 20) => {
  if (!isNativePlatform()) {
    throw new Error('Photo picker is only available on native platforms');
  }

  // Request permissions first
  const hasPermission = await requestPhotoPermissions();
  if (!hasPermission) {
    throw new Error('Photo library permission denied. Please grant access in Settings.');
  }

  try {
    // Pick multiple images
    const result = await Camera.pickImages({
      quality: 90,
      limit,
    });

    if (!result.photos || result.photos.length === 0) {
      return [];
    }

    // Process each photo
    const photos = result.photos.map((photo, index) => ({
      id: `native-photo-${Date.now()}-${index}`,
      uri: photo.path || '',
      webPath: photo.webPath || '',
      path: photo.path || '',
      // We'll extract metadata separately
      date: null,
      location: null,
    }));

    return photos;
  } catch (error) {
    if (error.message?.includes('User cancelled')) {
      return [];
    }
    throw error;
  }
};

/**
 * Pick a single photo from the library
 * @returns {Promise<{id: string, uri: string, webPath: string, path: string} | null>}
 */
export const pickSinglePhoto = async () => {
  if (!isNativePlatform()) {
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
    if (error.message?.includes('User cancelled')) {
      return null;
    }
    throw error;
  }
};

/**
 * Get a web-accessible URL for a photo
 * Works for both web URLs and native file paths
 * @param {object} photo - Photo object with uri, webPath, or url properties
 * @returns {string} Web-accessible URL
 */
export const getPhotoUrl = (photo) => {
  if (!photo) return '';

  // For web platform, use the url or webPath directly
  if (!isNativePlatform()) {
    return photo.url || photo.webPath || '';
  }

  // For native, prefer webPath (already converted), otherwise convert uri
  if (photo.webPath) {
    return photo.webPath;
  }

  if (photo.uri) {
    return convertFileSrc(photo.uri);
  }

  if (photo.path) {
    return convertFileSrc(photo.path);
  }

  return photo.url || '';
};
