import { beforeEach, describe, expect, it } from 'vitest';
import useGameStore from './gameStore';

// A minimal date-mode photo: correct answers are 2020 / May / 10.
const photo = (id) => ({
  id,
  date: { year: 2020, month: 5, day: 10 },
  location: null,
});

// Replaces the whole store state (bypassing persisted storage) so every test
// starts from a known, isolated setup instead of the zustand singleton's
// state leaking between tests.
function seedStore(overrides = {}) {
  // Merge (the zustand default), never replace: `setState(state, true)` swaps
  // out the whole store object, which would also wipe the action functions
  // (submitGuess, endTurn, ...) that `create()` bundled in alongside state.
  useGameStore.setState({
    gamePhase: 'playing',
    gameMode: 'date',
    players: [
      { id: 1, name: 'Player 1', score: 0 },
      { id: 2, name: 'Player 2', score: 0 },
    ],
    currentPlayerIndex: 0,
    allPhotos: [],
    photos: [photo('p1')],
    currentPhotoIndex: 0,
    usedPhotoIds: [],
    allCountries: [],
    allStates: [],
    allCities: [],
    guessPhase: 'year',
    currentGuess: { year: null, month: null, day: null },
    turnScore: 0,
    winningScore: 10,
    winner: null,
    pendingWinner: null,
    isTieBreaker: false,
    lastGuessCorrect: null,
    feedbackMessage: '',
    correctAnswer: null,
    ...overrides,
  });
}

// Drives a full correct year -> month -> day turn (the "perfect" path that
// ends the turn and runs the victory/tie-breaker decision) for whichever
// player is current.
function playPerfectTurn() {
  useGameStore.getState().submitGuess(2020); // year
  useGameStore.getState().submitGuess(5); // month
  useGameStore.getState().submitGuess(10); // day
}

beforeEach(() => {
  seedStore();
});

describe('submitGuess — normal win', () => {
  it('Player 2 wins outright when they alone reach the winning score', () => {
    seedStore({
      currentPlayerIndex: 1,
      players: [
        { id: 1, name: 'Player 1', score: 3 },
        { id: 2, name: 'Player 2', score: 4 }, // +6 perfect turn = 10 = winningScore
      ],
    });

    playPerfectTurn();

    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('victory');
    expect(state.winner?.id).toBe(2);
    expect(state.isTieBreaker).toBe(false);
    expect(state.pendingWinner).toBe(null);
  });
});

describe('submitGuess — tie-breaker trigger', () => {
  it('Player 1 reaching the winning score arms a tie-breaker instead of winning immediately', () => {
    seedStore({
      currentPlayerIndex: 0,
      players: [
        { id: 1, name: 'Player 1', score: 4 }, // +6 perfect turn = 10
        { id: 2, name: 'Player 2', score: 0 },
      ],
    });

    playPerfectTurn();

    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('feedback'); // not victory yet
    expect(state.winner).toBe(null);
    expect(state.isTieBreaker).toBe(true);
    expect(state.pendingWinner?.id).toBe(1);
    expect(state.pendingWinner?.score).toBe(10);
  });
});

describe('submitGuess — tie-breaker resolution', () => {
  it('sudden death: the responding player matching the score keeps the game going', () => {
    seedStore({
      currentPlayerIndex: 1,
      players: [
        { id: 1, name: 'Player 1', score: 10 },
        { id: 2, name: 'Player 2', score: 4 }, // +6 perfect turn = 10 = pendingWinner.score
      ],
      isTieBreaker: true,
      pendingWinner: { id: 1, name: 'Player 1', score: 10 },
    });

    playPerfectTurn();

    const state = useGameStore.getState();
    expect(state.winner).toBe(null);
    expect(state.isTieBreaker).toBe(false);
    expect(state.pendingWinner).toBe(null);
    expect(state.gamePhase).toBe('feedback');
  });

  it('the responder exceeding the pending score wins', () => {
    seedStore({
      currentPlayerIndex: 1,
      players: [
        { id: 1, name: 'Player 1', score: 10 },
        { id: 2, name: 'Player 2', score: 5 }, // +6 perfect turn = 11 > 10
      ],
      isTieBreaker: true,
      pendingWinner: { id: 1, name: 'Player 1', score: 10 },
    });

    playPerfectTurn();

    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('victory');
    expect(state.winner?.id).toBe(2);
  });

  // Regression for the 2026-09-16 fix: a tie-breaker turn that stayed under
  // the winning score used to fall through determineVictory's other branches
  // undecided, so the game never ended. A *perfect* turn (the branch that
  // used to have a "this shouldn't happen" comment) must still resolve.
  it('a perfect tie-breaker turn that stays under the pending score still awards the pending winner (regression)', () => {
    seedStore({
      currentPlayerIndex: 1,
      players: [
        { id: 1, name: 'Player 1', score: 10 },
        { id: 2, name: 'Player 2', score: 2 }, // +6 perfect turn = 8 < 10
      ],
      isTieBreaker: true,
      pendingWinner: { id: 1, name: 'Player 1', score: 10 },
    });

    playPerfectTurn();

    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('victory');
    expect(state.winner?.id).toBe(1);
    expect(state.isTieBreaker).toBe(false);
    expect(state.pendingWinner).toBe(null);
  });

  it('a wrong guess that ends the tie-breaker turn under the pending score awards the pending winner', () => {
    seedStore({
      currentPlayerIndex: 1,
      guessPhase: 'year',
      turnScore: 0,
      players: [
        { id: 1, name: 'Player 1', score: 10 },
        { id: 2, name: 'Player 2', score: 2 },
      ],
      isTieBreaker: true,
      pendingWinner: { id: 1, name: 'Player 1', score: 10 },
    });

    useGameStore.getState().submitGuess(1999); // wrong year, ends the turn with 0 points

    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('victory');
    expect(state.winner?.id).toBe(1);
    expect(state.players[1].score).toBe(2); // unchanged, no points earned
  });
});

describe('getNextAnswerablePhase interplay — a player index 0 ending a turn at/above the winning score', () => {
  it('still only arms the tie-breaker (never an immediate win) even far above the winning score', () => {
    seedStore({
      currentPlayerIndex: 0,
      players: [
        { id: 1, name: 'Player 1', score: 20 }, // already past winningScore
        { id: 2, name: 'Player 2', score: 0 },
      ],
    });

    playPerfectTurn();

    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('feedback');
    expect(state.isTieBreaker).toBe(true);
    expect(state.pendingWinner?.score).toBe(26);
  });
});
