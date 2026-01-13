#!/usr/bin/env node

/**
 * Photo Manifest Generator (with caching)
 *
 * Scans the public/photos directory, extracts EXIF dates and GPS coordinates,
 * performs reverse geocoding for location data, and generates a manifest.json.
 *
 * Caching: Only processes new/modified photos. Geocoding results are cached
 * to avoid redundant API calls on subsequent runs.
 *
 * Usage: node scripts/generate-manifest.js
 * Or:    npm run generate-manifest
 *
 * Flags:
 *   --force    Force regeneration, ignoring cache
 *
 * Runs automatically before `npm run dev` and `npm run build`
 */

import { readdir, writeFile, readFile, mkdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';
import exifr from 'exifr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PHOTOS_DIR = join(__dirname, '..', 'public', 'photos');
const MANIFEST_PATH = join(PHOTOS_DIR, 'manifest.json');
const CACHE_PATH = join(PHOTOS_DIR, '.manifest-cache.json');
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.tiff', '.tif'];

// Rate limiting for geocoding API (free tier limits)
const GEOCODE_DELAY_MS = 1100; // Nominatim requires 1 request per second max

// Check for --force flag
const FORCE_REGENERATE = process.argv.includes('--force');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadCache() {
  try {
    if (existsSync(CACHE_PATH)) {
      const data = await readFile(CACHE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // Cache corrupted or unreadable, start fresh
  }
  return { files: {} };
}

async function saveCache(cache) {
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function getFileMtime(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.mtimeMs;
  } catch {
    return null;
  }
}

async function reverseGeocode(latitude, longitude) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PhotoDateGuessingGame/1.0 (personal project)'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const address = data.address || {};

    return {
      country: address.country || null,
      state: address.state || address.province || address.region || null,
      city: address.city || address.town || address.village || address.municipality || address.county || null
    };
  } catch {
    return null;
  }
}

async function extractPhotoData(filePath) {
  try {
    // Parse all EXIF data (don't use pick to ensure GPS data is included)
    const exifData = await exifr.parse(filePath);

    if (!exifData) {
      return null;
    }

    // Extract date
    const dateValue = exifData.DateTimeOriginal || exifData.CreateDate || exifData.DateTime;
    let dateInfo = null;

    if (dateValue) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        dateInfo = {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate()
        };
      }
    }

    // Extract GPS coordinates (exifr provides decimal values as latitude/longitude)
    let gpsInfo = null;
    if (exifData.latitude !== undefined && exifData.longitude !== undefined) {
      gpsInfo = {
        latitude: exifData.latitude,
        longitude: exifData.longitude
      };
    }

    if (!dateInfo && !gpsInfo) {
      return null;
    }

    return { dateInfo, gpsInfo };
  } catch {
    return null;
  }
}

async function generateManifest() {
  // Ensure photos directory exists
  if (!existsSync(PHOTOS_DIR)) {
    await mkdir(PHOTOS_DIR, { recursive: true });
  }

  let files;
  try {
    files = await readdir(PHOTOS_DIR);
  } catch {
    const manifest = {
      generatedAt: new Date().toISOString(),
      photoCount: 0,
      locationCount: 0,
      photos: {}
    };
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log('📷 Photo manifest: 0 photos (add images to public/photos/)');
    return;
  }

  const imageFiles = files.filter(file => {
    const ext = extname(file).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext) && !file.startsWith('.');
  });

  // Load existing cache
  const cache = FORCE_REGENERATE ? { files: {} } : await loadCache();
  const newCache = { files: {} };

  const photos = {};
  let dateCount = 0;
  let locationCount = 0;
  let skipCount = 0;
  let cacheHits = 0;
  const photosNeedingGeocode = [];

  // Process each image file
  for (const filename of imageFiles) {
    const filePath = join(PHOTOS_DIR, filename);
    const mtime = await getFileMtime(filePath);

    // Check if we have valid cached data for this file
    const cached = cache.files[filename];
    const isCacheValid = cached && cached.mtime === mtime && !FORCE_REGENERATE;

    if (isCacheValid) {
      // Use cached data
      cacheHits++;
      newCache.files[filename] = cached;

      if (cached.date || cached.gps) {
        photos[filename] = {};

        if (cached.date) {
          photos[filename].date = cached.date;
          dateCount++;
        }

        if (cached.gps) {
          photos[filename].gps = cached.gps;

          // Check if we have cached location data
          if (cached.location) {
            photos[filename].location = cached.location;
            locationCount++;
          } else {
            // Need to geocode this one
            photosNeedingGeocode.push(filename);
          }
        }
      } else {
        skipCount++;
      }
    } else {
      // Extract fresh EXIF data
      const photoData = await extractPhotoData(filePath);

      // Initialize cache entry
      newCache.files[filename] = { mtime };

      if (photoData) {
        photos[filename] = {};

        if (photoData.dateInfo) {
          photos[filename].date = photoData.dateInfo;
          newCache.files[filename].date = photoData.dateInfo;
          dateCount++;
        }

        if (photoData.gpsInfo) {
          photos[filename].gps = photoData.gpsInfo;
          newCache.files[filename].gps = photoData.gpsInfo;
          photosNeedingGeocode.push(filename);
        }
      } else {
        skipCount++;
      }
    }
  }

  // Second pass: reverse geocode GPS coordinates (only for photos without cached location)
  if (photosNeedingGeocode.length > 0) {
    console.log(`📍 Geocoding ${photosNeedingGeocode.length} photo location(s)...`);

    for (let i = 0; i < photosNeedingGeocode.length; i++) {
      const filename = photosNeedingGeocode[i];
      const { latitude, longitude } = photos[filename].gps;

      const locationData = await reverseGeocode(latitude, longitude);

      if (locationData) {
        photos[filename].location = locationData;
        newCache.files[filename].location = locationData;
        locationCount++;
      }

      // Rate limiting - wait before next request (except for last one)
      if (i < photosNeedingGeocode.length - 1) {
        await sleep(GEOCODE_DELAY_MS);
      }
    }
  }

  // Save updated cache
  await saveCache(newCache);

  const manifest = {
    generatedAt: new Date().toISOString(),
    photoCount: dateCount,
    locationCount,
    photos
  };

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  // Compact output for dev server
  const parts = [];
  if (dateCount > 0) parts.push(`${dateCount} with dates`);
  if (locationCount > 0) parts.push(`${locationCount} with locations`);

  const cacheInfo = cacheHits > 0 ? ` (${cacheHits} cached)` : '';

  if (parts.length === 0) {
    console.log('📷 Photo manifest: 0 usable photos (add images to public/photos/)');
  } else {
    console.log(`📷 Photo manifest: ${parts.join(', ')}${skipCount > 0 ? `, ${skipCount} skipped` : ''}${cacheInfo}`);
  }

  if (dateCount > 0 && dateCount < 3) {
    console.log('   ⚠️  Need at least 3 photos with dates for Date mode');
  }
  if (locationCount > 0 && locationCount < 3) {
    console.log('   ⚠️  Need at least 3 photos with GPS for Location mode');
  }
}

generateManifest().catch(console.error);
