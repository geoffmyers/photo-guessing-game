// Game configuration - loaded from shared JSON
// Source: shared/photo-guessing-game/data/game-config.json
import sharedConfig from '../../../../shared/photo-guessing-game/data/game-config.json';

export const GAME_CONFIG = {
  WINNING_SCORE: sharedConfig.game.winningScore,
  MIN_PHOTOS_TO_START: sharedConfig.game.minimumPhotosRequired,

  // Game modes
  MODES: {
    DATE: 'date',
    LOCATION: 'location'
  },

  // Scoring (same for both modes)
  POINTS: {
    // Date mode
    YEAR: sharedConfig.scoring.date.year.points,
    MONTH: sharedConfig.scoring.date.month.points,
    DAY: sharedConfig.scoring.date.day.points,
    // Location mode
    COUNTRY: sharedConfig.scoring.location.country.points,
    STATE: sharedConfig.scoring.location.state.points,
    CITY: sharedConfig.scoring.location.city.points
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

export const FEEDBACK_DURATION = sharedConfig.game.feedbackDurationMs;

// Export shared config for direct access
export { sharedConfig };
