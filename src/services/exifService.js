import exifr from 'exifr';
import { isNativePlatform } from './platform';
import { sharedConfig } from '../data/constants';
import { reverseGeocodeUrl, placeFromAddress } from '../utils/geocoding';

const GEOCODING = sharedConfig.geocoding;

/**
 * Extract date and location metadata from a photo
 * @param {object} photo - Photo object with webPath or url
 * @returns {Promise<{date: object|null, location: object|null, gps: object|null}>}
 */
export const extractPhotoMetadata = async (photo) => {
  const metadata = {
    date: null,
    location: null,
    gps: null,
  };

  try {
    // Get the URL to read from
    const imageUrl = photo.webPath || photo.url || photo.uri;
    if (!imageUrl) {
      console.warn('No image URL available for metadata extraction');
      return metadata;
    }

    // Use exifr to extract EXIF data (works in WebView too)
    const exifData = await exifr.parse(imageUrl, {
      pick: [
        'DateTimeOriginal',
        'CreateDate',
        'DateTime',
        'DateTimeDigitized',
        'GPSLatitude',
        'GPSLongitude',
        'GPSLatitudeRef',
        'GPSLongitudeRef',
      ],
    });

    if (!exifData) {
      return metadata;
    }

    // Extract date
    const dateField = exifData.DateTimeOriginal ||
      exifData.CreateDate ||
      exifData.DateTime ||
      exifData.DateTimeDigitized;

    if (dateField) {
      const date = new Date(dateField);
      if (!isNaN(date.getTime())) {
        metadata.date = {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
        };
      }
    }

    // Extract GPS coordinates
    if (exifData.GPSLatitude !== undefined && exifData.GPSLongitude !== undefined) {
      // exifr already converts to decimal degrees
      let latitude = exifData.GPSLatitude;
      let longitude = exifData.GPSLongitude;

      // Apply reference direction if needed
      if (exifData.GPSLatitudeRef === 'S') latitude = -Math.abs(latitude);
      if (exifData.GPSLongitudeRef === 'W') longitude = -Math.abs(longitude);

      metadata.gps = { latitude, longitude };

      // Reverse geocode to get location
      try {
        metadata.location = await reverseGeocode(latitude, longitude);
      } catch (geoError) {
        console.warn('Reverse geocoding failed:', geoError);
      }
    }
  } catch (error) {
    console.warn('EXIF extraction failed:', error);
  }

  return metadata;
};

/**
 * Reverse geocode coordinates to get country, state, city
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{country: string, state: string, city: string} | null>}
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      reverseGeocodeUrl(GEOCODING, latitude, longitude),
      {
        headers: {
          'User-Agent': 'PhotoGuessingGame/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.address) {
      return null;
    }

    return placeFromAddress(GEOCODING, data.address);
  } catch (error) {
    console.warn('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Extract metadata from multiple photos with progress callback
 * @param {Array} photos - Array of photo objects
 * @param {Function} onProgress - Callback with (current, total)
 * @returns {Promise<Array>} Photos with metadata attached
 */
export const extractMetadataFromPhotos = async (photos, onProgress = () => {}) => {
  const results = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    onProgress(i + 1, photos.length);

    try {
      const metadata = await extractPhotoMetadata(photo);

      results.push({
        ...photo,
        date: metadata.date,
        location: metadata.location,
        gps: metadata.gps,
      });

      // Add delay if we did reverse geocoding to respect rate limits
      if (metadata.gps && i < photos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, GEOCODING.rateLimitMs));
      }
    } catch (error) {
      console.warn(`Failed to extract metadata from photo ${i}:`, error);
      results.push(photo);
    }
  }

  return results;
};
