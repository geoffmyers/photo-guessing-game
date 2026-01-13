import exifr from 'exifr';

/**
 * Extract date information from a photo's EXIF metadata
 * @param {File} file - The image file to extract date from
 * @returns {Promise<{year: number, month: number, day: number} | null>}
 */
export const extractDateFromPhoto = async (file) => {
  try {
    const exifData = await exifr.parse(file, [
      'DateTimeOriginal',
      'CreateDate',
      'DateTime',
      'DateTimeDigitized'
    ]);

    // Try different date fields in order of preference
    const dateValue = exifData?.DateTimeOriginal
      || exifData?.CreateDate
      || exifData?.DateTime
      || exifData?.DateTimeDigitized;

    if (!dateValue) {
      return null;
    }

    // Handle both Date objects and string formats
    let date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      // EXIF date format is typically "YYYY:MM:DD HH:MM:SS"
      const parts = dateValue.split(' ')[0].split(':');
      if (parts.length === 3) {
        date = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        date = new Date(dateValue);
      }
    } else {
      return null;
    }

    // Validate the date
    if (isNaN(date.getTime())) {
      return null;
    }

    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1, // Convert from 0-indexed to 1-indexed
      day: date.getDate()
    };
  } catch (error) {
    console.warn('EXIF extraction failed:', error);
    return null;
  }
};

/**
 * Read a file as a data URL for display
 * @param {File} file - The file to read
 * @returns {Promise<string>}
 */
export const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
