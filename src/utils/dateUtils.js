import { GAME_CONFIG } from '../data/constants';

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
 * Points for answering one phase correctly (1, 2 and 3 by default, from the
 * game config), so a turn's score is the sum of the phases actually asked.
 */
export const getPhasePoints = (phase) => GAME_CONFIG.POINTS[phase?.toUpperCase()] ?? 0;

/**
 * The next phase this photo can be asked about, or null when the turn is over.
 * Reverse geocoding does not always return a state or a city, and a selector
 * with no correct answer has no options, so those phases are skipped.
 */
export const getNextAnswerablePhase = (currentPhase, mode, answerData) => {
  let next = getNextPhase(currentPhase, mode);
  while (next && (answerData?.[next] === null || answerData?.[next] === undefined)) {
    next = getNextPhase(next, mode);
  }
  return next;
};

/**
 * Get the initial guess phase for a mode
 */
export const getInitialPhase = (mode) => {
  return mode === GAME_CONFIG.MODES.LOCATION ? 'country' : 'year';
};

/**
 * Generate year options for multiple choice
 * Returns GAME_CONFIG.YEAR_OPTIONS years including the correct one, randomly
 * ordered, all within half of GAME_CONFIG.YEAR_RANGE of it
 */
export const generateYearOptions = (correctYear) => {
  const currentYear = new Date().getFullYear();
  const maxOffset = Math.floor(GAME_CONFIG.YEAR_RANGE / 2);
  const options = new Set([correctYear]);

  // Plausible distractors: the four years either side first, then a spread
  // further out, then any other year in range (nearest first)
  const spread = [-4, -3, -2, -1, 1, 2, 3, 4, -6, 6, -8, 8, -10, 10];
  const nearest = Array.from({ length: maxOffset }, (_, i) => [-(i + 1), i + 1]).flat();

  for (const offset of [...spread, ...nearest]) {
    if (options.size >= GAME_CONFIG.YEAR_OPTIONS) break;
    const year = correctYear + offset;
    // Only add valid years (1900 to current year)
    if (Math.abs(offset) <= maxOffset && year >= 1900 && year <= currentYear) {
      options.add(year);
    }
  }

  // Convert to array and shuffle
  return shuffleArray([...options]);
};

/**
 * Generate location options for multiple choice
 * Takes the correct value and a list of all available values
 * Returns up to GAME_CONFIG.LOCATION_OPTIONS options including the correct
 * one, randomly ordered
 */
export const generateLocationOptions = (correctValue, allValues) => {
  if (!correctValue) return [];

  const options = new Set([correctValue]);

  // Filter out nulls and the correct value from potential distractors
  const distractors = allValues.filter(v => v && v !== correctValue);

  // Shuffle distractors
  const shuffledDistractors = shuffleArray(distractors);

  // Fill the remaining options with distractors
  for (const distractor of shuffledDistractors) {
    if (options.size >= GAME_CONFIG.LOCATION_OPTIONS) break;
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
export const formatPoints = (points) => `${points} point${points === 1 ? '' : 's'}`;

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
