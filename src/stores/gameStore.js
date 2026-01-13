import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GAME_CONFIG } from '../data/constants';
import {
  checkGuess,
  getPointsForPhase,
  getNextPhase,
  getInitialPhase,
  shuffleArray,
  formatDate,
  formatLocation
} from '../utils/dateUtils';
import { createCrossplatformStorage } from '../services/storageService';

const getInitialGuess = (mode) => {
  if (mode === GAME_CONFIG.MODES.LOCATION) {
    return { country: null, state: null, city: null };
  }
  return { year: null, month: null, day: null };
};

const initialState = {
  // Game phase: 'setup' | 'playing' | 'feedback' | 'victory' | 'no_photos'
  gamePhase: GAME_CONFIG.PHASES.SETUP,

  // Game mode: 'date' | 'location'
  gameMode: GAME_CONFIG.MODES.DATE,

  // Players
  players: [
    { id: 1, name: 'Player 1', score: 0 },
    { id: 2, name: 'Player 2', score: 0 }
  ],
  currentPlayerIndex: 0,

  // Photos - all loaded photos
  allPhotos: [],
  // Photos filtered for current mode (unused photos only)
  photos: [],
  currentPhotoIndex: 0,
  // Track used photo IDs within a game session
  usedPhotoIds: [],

  // Location data pools (for generating options)
  allCountries: [],
  allStates: [],
  allCities: [],

  // Guessing state
  guessPhase: 'year',
  currentGuess: { year: null, month: null, day: null },
  turnScore: 0,

  // Feedback state
  lastGuessCorrect: null,
  feedbackMessage: '',
  correctAnswer: null,

  // Victory
  winningScore: GAME_CONFIG.WINNING_SCORE,
  winner: null,

  // Tie-breaker state
  // When a player reaches the winning score, if the other player hasn't had
  // an equal number of turns, they get a chance to tie or win
  pendingWinner: null, // Player who reached winning score first
  isTieBreaker: false  // True when other player is responding to reach/beat
};

const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Player actions
      setPlayerName: (playerId, name) => set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, name } : p
        )
      })),

      // Game mode actions
      setGameMode: (mode) => set({ gameMode: mode }),

      // Photo actions
      loadPhotos: (photos) => {
        // Extract unique location values for option generation
        const allCountries = [...new Set(photos.map(p => p.location?.country).filter(Boolean))];
        const allStates = [...new Set(photos.map(p => p.location?.state).filter(Boolean))];
        const allCities = [...new Set(photos.map(p => p.location?.city).filter(Boolean))];

        set({
          allPhotos: photos,
          allCountries,
          allStates,
          allCities
        });
      },

      // Get photos available for current mode
      getPhotosForMode: (mode) => {
        const { allPhotos } = get();
        if (mode === GAME_CONFIG.MODES.LOCATION) {
          return allPhotos.filter(p => p.location?.country);
        }
        return allPhotos.filter(p => p.date);
      },

      // Game flow actions
      startGame: () => {
        const { gameMode, allPhotos } = get();

        // Filter photos based on mode
        let modePhotos;
        if (gameMode === GAME_CONFIG.MODES.LOCATION) {
          modePhotos = allPhotos.filter(p => p.location?.country);
        } else {
          modePhotos = allPhotos.filter(p => p.date);
        }

        if (modePhotos.length < GAME_CONFIG.MIN_PHOTOS_TO_START) {
          return false;
        }

        const initialPhase = getInitialPhase(gameMode);
        const initialGuess = getInitialGuess(gameMode);

        set({
          gamePhase: GAME_CONFIG.PHASES.PLAYING,
          photos: shuffleArray(modePhotos),
          currentPhotoIndex: 0,
          usedPhotoIds: [],
          guessPhase: initialPhase,
          currentGuess: initialGuess,
          turnScore: 0,
          currentPlayerIndex: 0,
          players: get().players.map((p) => ({ ...p, score: 0 })),
          winner: null,
          pendingWinner: null,
          isTieBreaker: false
        });
        return true;
      },

      submitGuess: (value) => {
        const state = get();
        const currentPhoto = state.photos[state.currentPhotoIndex];
        const { gameMode, isTieBreaker, pendingWinner } = state;

        // Get the correct answer object based on mode
        const answerData = gameMode === GAME_CONFIG.MODES.LOCATION
          ? currentPhoto.location
          : currentPhoto.date;

        const isCorrect = checkGuess(value, answerData, state.guessPhase, gameMode);

        // Helper to determine victory state considering tie-breaker rules
        const determineVictory = (updatedPlayers, currentPlayerIdx) => {
          const currentPlayer = updatedPlayers[currentPlayerIdx];
          const otherPlayer = updatedPlayers[(currentPlayerIdx + 1) % 2];
          const reachedWinningScore = currentPlayer.score >= state.winningScore;

          if (!reachedWinningScore) {
            // No one has reached winning score yet
            return { winner: null, newPendingWinner: null, newIsTieBreaker: false };
          }

          // Current player reached winning score
          if (isTieBreaker) {
            // We're in a tie-breaker round
            if (currentPlayer.score > pendingWinner.score) {
              // Tie-breaker player exceeded the pending winner - they win
              return { winner: currentPlayer, newPendingWinner: null, newIsTieBreaker: false };
            } else if (currentPlayer.score === pendingWinner.score) {
              // Scores are tied - continue playing (sudden death)
              return { winner: null, newPendingWinner: null, newIsTieBreaker: false };
            }
            // This shouldn't happen during a correct guess in tie-breaker
            // (handled in wrong guess case)
          }

          // Not in tie-breaker yet - check if we need one
          // Player 1 (index 0) goes first, so if they reach winning score,
          // Player 2 deserves a chance to respond
          if (currentPlayerIdx === 0) {
            // Player 1 reached winning score - give Player 2 a tie-breaker turn
            return {
              winner: null,
              newPendingWinner: { ...currentPlayer },
              newIsTieBreaker: true
            };
          } else {
            // Player 2 reached winning score
            if (pendingWinner) {
              // Player 1 had already reached winning score too
              if (currentPlayer.score > pendingWinner.score) {
                // Player 2 exceeded Player 1's score - Player 2 wins
                return { winner: currentPlayer, newPendingWinner: null, newIsTieBreaker: false };
              } else if (currentPlayer.score === pendingWinner.score) {
                // Tied - continue playing (sudden death)
                return { winner: null, newPendingWinner: null, newIsTieBreaker: false };
              } else {
                // Player 2 didn't match - Player 1 wins
                return { winner: pendingWinner, newPendingWinner: null, newIsTieBreaker: false };
              }
            } else {
              // Player 2 reached winning score first (Player 1 didn't)
              // This shouldn't normally happen since turns alternate,
              // but handle it: Player 2 wins outright
              return { winner: currentPlayer, newPendingWinner: null, newIsTieBreaker: false };
            }
          }
        };

        if (isCorrect) {
          const newTurnScore = getPointsForPhase(state.guessPhase, gameMode);
          const nextPhase = getNextPhase(state.guessPhase, gameMode);

          // Update current guess
          const newGuess = { ...state.currentGuess, [state.guessPhase]: value };

          if (!nextPhase) {
            // Perfect guess - add all points, check victory, end turn
            const updatedPlayers = state.players.map((p, i) =>
              i === state.currentPlayerIndex
                ? { ...p, score: p.score + newTurnScore }
                : p
            );

            const { winner, newPendingWinner, newIsTieBreaker } = determineVictory(
              updatedPlayers,
              state.currentPlayerIndex
            );

            const successMsg = gameMode === GAME_CONFIG.MODES.LOCATION
              ? `Exact location! +${newTurnScore} points!`
              : `Exact date! +${newTurnScore} points!`;

            set({
              players: updatedPlayers,
              currentGuess: newGuess,
              turnScore: newTurnScore,
              lastGuessCorrect: true,
              feedbackMessage: successMsg,
              correctAnswer: answerData,
              gamePhase: winner ? GAME_CONFIG.PHASES.VICTORY : GAME_CONFIG.PHASES.FEEDBACK,
              winner,
              pendingWinner: newPendingWinner,
              isTieBreaker: newIsTieBreaker
            });
          } else {
            // Correct but can continue
            let continueMsg;
            if (gameMode === GAME_CONFIG.MODES.LOCATION) {
              continueMsg = state.guessPhase === 'country'
                ? 'Correct country! Now guess the state/province.'
                : 'Correct state! Now guess the city.';
            } else {
              continueMsg = state.guessPhase === 'year'
                ? 'Correct year! Now guess the month.'
                : 'Correct month! Now guess the day.';
            }

            set({
              currentGuess: newGuess,
              guessPhase: nextPhase,
              turnScore: newTurnScore,
              lastGuessCorrect: true,
              feedbackMessage: continueMsg
            });
          }
        } else {
          // Wrong guess - add accumulated points, end turn
          const pointsToAdd = state.turnScore;
          const updatedPlayers = state.players.map((p, i) =>
            i === state.currentPlayerIndex
              ? { ...p, score: p.score + pointsToAdd }
              : p
          );

          // Handle tie-breaker failure: if we're in a tie-breaker and current player
          // got a wrong answer, check if pending winner should win
          let winner = null;
          let newPendingWinner = pendingWinner;
          let newIsTieBreaker = isTieBreaker;

          if (isTieBreaker && pendingWinner) {
            const currentPlayer = updatedPlayers[state.currentPlayerIndex];
            if (currentPlayer.score < pendingWinner.score) {
              // Tie-breaker player failed to match - pending winner wins
              winner = pendingWinner;
              newPendingWinner = null;
              newIsTieBreaker = false;
            } else if (currentPlayer.score >= pendingWinner.score) {
              // Matched or exceeded despite wrong guess - continue or check
              const victoryResult = determineVictory(updatedPlayers, state.currentPlayerIndex);
              winner = victoryResult.winner;
              newPendingWinner = victoryResult.newPendingWinner;
              newIsTieBreaker = victoryResult.newIsTieBreaker;
            }
          } else {
            // Not in tie-breaker - check normally
            const victoryResult = determineVictory(updatedPlayers, state.currentPlayerIndex);
            winner = victoryResult.winner;
            newPendingWinner = victoryResult.newPendingWinner;
            newIsTieBreaker = victoryResult.newIsTieBreaker;
          }

          set({
            players: updatedPlayers,
            lastGuessCorrect: false,
            feedbackMessage: pointsToAdd > 0
              ? `Wrong! You earned ${pointsToAdd} point${pointsToAdd > 1 ? 's' : ''} this turn.`
              : 'Wrong! No points this turn.',
            correctAnswer: answerData,
            gamePhase: winner ? GAME_CONFIG.PHASES.VICTORY : GAME_CONFIG.PHASES.FEEDBACK,
            winner,
            pendingWinner: newPendingWinner,
            isTieBreaker: newIsTieBreaker
          });
        }
      },

      endTurn: () => {
        const state = get();
        const { gameMode } = state;

        // Mark current photo as used
        const currentPhoto = state.photos[state.currentPhotoIndex];
        const newUsedPhotoIds = [...state.usedPhotoIds, currentPhoto.id];

        // Get remaining unused photos
        const remainingPhotos = state.photos.filter(
          (p, idx) => idx > state.currentPhotoIndex
        );

        // Check if there are more photos available
        if (remainingPhotos.length === 0) {
          // No more photos - end game with current standings
          set({
            usedPhotoIds: newUsedPhotoIds,
            gamePhase: 'no_photos',
            lastGuessCorrect: null,
            feedbackMessage: '',
            correctAnswer: null
          });
          return;
        }

        const initialPhase = getInitialPhase(gameMode);
        const initialGuess = getInitialGuess(gameMode);

        set({
          usedPhotoIds: newUsedPhotoIds,
          currentPhotoIndex: state.currentPhotoIndex + 1,
          currentPlayerIndex: (state.currentPlayerIndex + 1) % 2,
          guessPhase: initialPhase,
          currentGuess: initialGuess,
          turnScore: 0,
          gamePhase: GAME_CONFIG.PHASES.PLAYING,
          lastGuessCorrect: null,
          feedbackMessage: '',
          correctAnswer: null
        });
      },

      resetGame: () => {
        const state = get();
        set({
          ...initialState,
          allPhotos: state.allPhotos,
          allCountries: state.allCountries,
          allStates: state.allStates,
          allCities: state.allCities,
          gameMode: state.gameMode
        });
      },

      fullReset: () => set(initialState),

      // Getters
      getCurrentPlayer: () => {
        const { players, currentPlayerIndex } = get();
        return players[currentPlayerIndex];
      },

      getCurrentPhoto: () => {
        const { photos, currentPhotoIndex } = get();
        return photos[currentPhotoIndex] || null;
      },

      getOtherPlayer: () => {
        const { players, currentPlayerIndex } = get();
        return players[(currentPlayerIndex + 1) % 2];
      },

      // Format the correct answer for display
      getFormattedAnswer: () => {
        const { correctAnswer, gameMode } = get();
        if (!correctAnswer) return '';
        return gameMode === GAME_CONFIG.MODES.LOCATION
          ? formatLocation(correctAnswer)
          : formatDate(correctAnswer);
      }
    }),
    {
      name: 'photo-date-game-storage',
      // Use cross-platform storage (localStorage on web, Capacitor Preferences on native)
      storage: createJSONStorage(() => createCrossplatformStorage()),
      // Only persist specific state (exclude photos which are loaded dynamically)
      partialize: (state) => ({
        gamePhase: state.gamePhase,
        gameMode: state.gameMode,
        players: state.players,
        currentPlayerIndex: state.currentPlayerIndex,
        // Don't persist photos on native (they have file:// URIs that may not persist)
        // photos: state.photos,
        currentPhotoIndex: state.currentPhotoIndex,
        usedPhotoIds: state.usedPhotoIds,
        guessPhase: state.guessPhase,
        currentGuess: state.currentGuess,
        turnScore: state.turnScore,
        lastGuessCorrect: state.lastGuessCorrect,
        feedbackMessage: state.feedbackMessage,
        correctAnswer: state.correctAnswer,
        winningScore: state.winningScore,
        winner: state.winner,
        pendingWinner: state.pendingWinner,
        isTieBreaker: state.isTieBreaker
      })
    }
  )
);

export default useGameStore;
