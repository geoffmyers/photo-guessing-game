import { GAME_CONFIG } from '../data/constants';

// Scoring constants
export const SCORING = {
  // Date mode
  YEAR_ONLY: 1,
  YEAR_AND_MONTH: 3,
  EXACT_DATE: 6,
  // Location mode
  COUNTRY_ONLY: 1,
  COUNTRY_AND_STATE: 3,
  EXACT_LOCATION: 6
};

export const WINNING_SCORE = 10;

// Month names for display
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Short month names
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Check if a guess matches the actual value (date mode)
 */
export const checkDateGuess = (guess, actual, phase) => {
  switch (phase) {
    case 'year':
      return guess === actual.year;
    case 'month':
      return guess === actual.month;
    case 'day':
      return guess === actual.day;
    default:
      return false;
  }
};

/**
 * Check if a guess matches the actual value (location mode)
 * Uses case-insensitive comparison for location strings
 */
export const checkLocationGuess = (guess, actual, phase) => {
  const normalize = (str) => str?.toLowerCase().trim() || '';

  switch (phase) {
    case 'country':
      return normalize(guess) === normalize(actual.country);
    case 'state':
      return normalize(guess) === normalize(actual.state);
    case 'city':
      return normalize(guess) === normalize(actual.city);
    default:
      return false;
  }
};

/**
 * Unified check guess function that works for both modes
 */
export const checkGuess = (guess, actual, phase, mode) => {
  if (mode === GAME_CONFIG.MODES.LOCATION) {
    return checkLocationGuess(guess, actual, phase);
  }
  return checkDateGuess(guess, actual, phase);
};

/**
 * Calculate cumulative points based on current phase (date mode)
 */
export const getDatePointsForPhase = (phase) => {
  switch (phase) {
    case 'year':
      return SCORING.YEAR_ONLY;
    case 'month':
      return SCORING.YEAR_AND_MONTH;
    case 'day':
      return SCORING.EXACT_DATE;
    default:
      return 0;
  }
};

/**
 * Calculate cumulative points based on current phase (location mode)
 */
export const getLocationPointsForPhase = (phase) => {
  switch (phase) {
    case 'country':
      return SCORING.COUNTRY_ONLY;
    case 'state':
      return SCORING.COUNTRY_AND_STATE;
    case 'city':
      return SCORING.EXACT_LOCATION;
    default:
      return 0;
  }
};

/**
 * Unified get points function
 */
export const getPointsForPhase = (phase, mode) => {
  if (mode === GAME_CONFIG.MODES.LOCATION) {
    return getLocationPointsForPhase(phase);
  }
  return getDatePointsForPhase(phase);
};

/**
 * Get the next guess phase (date mode)
 */
export const getNextDatePhase = (currentPhase) => {
  switch (currentPhase) {
    case 'year':
      return 'month';
    case 'month':
      return 'day';
    default:
      return null;
  }
};

/**
 * Get the next guess phase (location mode)
 */
export const getNextLocationPhase = (currentPhase) => {
  switch (currentPhase) {
    case 'country':
      return 'state';
    case 'state':
      return 'city';
    default:
      return null;
  }
};

/**
 * Unified get next phase function
 */
export const getNextPhase = (currentPhase, mode) => {
  if (mode === GAME_CONFIG.MODES.LOCATION) {
    return getNextLocationPhase(currentPhase);
  }
  return getNextDatePhase(currentPhase);
};

/**
 * Get the initial guess phase for a mode
 */
export const getInitialPhase = (mode) => {
  return mode === GAME_CONFIG.MODES.LOCATION ? 'country' : 'year';
};

/**
 * Generate year options for multiple choice
 * Returns 8 years including the correct one, randomly ordered
 */
export const generateYearOptions = (correctYear) => {
  const currentYear = new Date().getFullYear();
  const options = new Set([correctYear]);

  // Generate plausible distractor years - expanded range for 8 options
  const ranges = [-4, -3, -2, -1, 1, 2, 3, 4, -6, 6, -8, 8, -10, 10];
  let rangeIndex = 0;

  while (options.size < 8 && rangeIndex < ranges.length) {
    const year = correctYear + ranges[rangeIndex];
    // Only add valid years (1900 to current year)
    if (year >= 1900 && year <= currentYear) {
      options.add(year);
    }
    rangeIndex++;
  }

  // If we still don't have 8 options, add random nearby years
  while (options.size < 8) {
    const offset = Math.floor(Math.random() * 15) - 7;
    const year = correctYear + offset;
    if (year >= 1900 && year <= currentYear) {
      options.add(year);
    }
  }

  // Convert to array and shuffle
  return shuffleArray([...options]);
};

/**
 * Generate location options for multiple choice
 * Takes the correct value and a list of all available values
 * Returns 5 options including the correct one, randomly ordered
 */
export const generateLocationOptions = (correctValue, allValues) => {
  if (!correctValue) return [];

  const options = new Set([correctValue]);

  // Filter out nulls and the correct value from potential distractors
  const distractors = allValues.filter(v => v && v !== correctValue);

  // Shuffle distractors
  const shuffledDistractors = shuffleArray(distractors);

  // Add up to 4 distractors
  for (const distractor of shuffledDistractors) {
    if (options.size >= 5) break;
    options.add(distractor);
  }

  return shuffleArray([...options]);
};

/**
 * Get the number of days in a month
 */
export const getDaysInMonth = (month, year) => {
  // Month is 1-indexed
  return new Date(year, month, 0).getDate();
};

/**
 * Fisher-Yates shuffle algorithm
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Format a date object for display
 */
export const formatDate = (dateObj) => {
  if (!dateObj) return '';
  const { year, month, day } = dateObj;
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
};

/**
 * Format a location object for display
 */
export const formatLocation = (locationObj) => {
  if (!locationObj) return '';
  const { city, state, country } = locationObj;
  const parts = [city, state, country].filter(Boolean);
  return parts.join(', ');
};
