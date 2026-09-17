import { describe, expect, it } from 'vitest';
import { checkGuess, getNextAnswerablePhase } from './dateUtils';

describe('checkGuess (date mode)', () => {
  const answer = { year: 2020, month: 5, day: 10 };

  it('matches the correct year', () => {
    expect(checkGuess(2020, answer, 'year', 'date')).toBe(true);
  });

  it('rejects a wrong year', () => {
    expect(checkGuess(2019, answer, 'year', 'date')).toBe(false);
  });

  it('matches the correct month and day', () => {
    expect(checkGuess(5, answer, 'month', 'date')).toBe(true);
    expect(checkGuess(10, answer, 'day', 'date')).toBe(true);
  });

  it('returns false for an unknown phase', () => {
    expect(checkGuess(2020, answer, 'century', 'date')).toBe(false);
  });
});

describe('checkGuess (location mode)', () => {
  const answer = { country: 'France', state: 'Île-de-France', city: 'Paris' };

  it('matches case- and whitespace-insensitively', () => {
    expect(checkGuess('  france ', answer, 'country', 'location')).toBe(true);
    expect(checkGuess('PARIS', answer, 'city', 'location')).toBe(true);
  });

  it('rejects a wrong location', () => {
    expect(checkGuess('Germany', answer, 'country', 'location')).toBe(false);
  });

  it('treats a missing guess as not matching', () => {
    expect(checkGuess(null, answer, 'city', 'location')).toBe(false);
  });
});

describe('getNextAnswerablePhase', () => {
  it('walks year -> month -> day when all fields are present', () => {
    const answer = { year: 2020, month: 5, day: 10 };
    expect(getNextAnswerablePhase('year', 'date', answer)).toBe('month');
    expect(getNextAnswerablePhase('month', 'date', answer)).toBe('day');
    expect(getNextAnswerablePhase('day', 'date', answer)).toBe(null);
  });

  it('skips a phase the photo has no answer for (date)', () => {
    // No day recorded (e.g. EXIF only gave year + month).
    const answer = { year: 2020, month: 5, day: null };
    expect(getNextAnswerablePhase('year', 'date', answer)).toBe('month');
    expect(getNextAnswerablePhase('month', 'date', answer)).toBe(null);
  });

  it('skips a phase the photo has no answer for (location)', () => {
    // Reverse geocoding returned a country but no state or city.
    const answer = { country: 'France', state: null, city: null };
    expect(getNextAnswerablePhase('country', 'location', answer)).toBe(null);
  });

  it('skips state but stops at city when only city is missing', () => {
    const answer = { country: 'France', state: 'Île-de-France', city: null };
    expect(getNextAnswerablePhase('country', 'location', answer)).toBe('state');
    expect(getNextAnswerablePhase('state', 'location', answer)).toBe(null);
  });
});
