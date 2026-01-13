// Game configuration constants

export const GAME_CONFIG = {
  WINNING_SCORE: 10,
  MIN_PHOTOS_TO_START: 3,

  // Game modes
  MODES: {
    DATE: 'date',
    LOCATION: 'location'
  },

  // Scoring (same for both modes)
  POINTS: {
    // Date mode
    YEAR: 1,
    MONTH: 2,  // Additional points for month (total 3)
    DAY: 3,    // Additional points for day (total 6)
    // Location mode
    COUNTRY: 1,
    STATE: 2,  // Additional points for state (total 3)
    CITY: 3    // Additional points for city (total 6)
  },

  // Game phases
  PHASES: {
    SETUP: 'setup',
    PLAYING: 'playing',
    FEEDBACK: 'feedback',
    VICTORY: 'victory'
  },

  // Guess phases for date mode
  DATE_GUESS_PHASES: {
    YEAR: 'year',
    MONTH: 'month',
    DAY: 'day'
  },

  // Guess phases for location mode
  LOCATION_GUESS_PHASES: {
    COUNTRY: 'country',
    STATE: 'state',
    CITY: 'city'
  }
};

export const FEEDBACK_DURATION = 2000; // ms to show feedback overlay
