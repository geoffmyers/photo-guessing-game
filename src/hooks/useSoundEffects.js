import { useCallback, useRef } from 'react';

// Web Audio API sound synthesizer - no external files needed
const useSoundEffects = () => {
  const audioContextRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a success/correct sound - ascending cheerful tone
  const playCorrect = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Create oscillator for the main tone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Ascending arpeggio: C5 -> E5 -> G5
      const frequencies = [523.25, 659.25, 783.99];

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialDecayTo = 0.01;

      // Play ascending notes
      frequencies.forEach((freq, i) => {
        const noteTime = now + i * 0.1;
        osc1.frequency.setValueAtTime(freq, noteTime);
        osc2.frequency.setValueAtTime(freq * 2, noteTime);
      });

      // Fade out
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {
      // Audio not available, fail silently
    }
  }, [getAudioContext]);

  // Play an incorrect/wrong sound - descending tone
  const playIncorrect = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Descending "wah wah" sound
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio not available, fail silently
    }
  }, [getAudioContext]);

  // Play a victory fanfare
  const playVictory = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Fanfare notes: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const durations = [0.15, 0.15, 0.15, 0.4];

      let time = now;
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = i === notes.length - 1 ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(freq, time);

        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);

        osc.start(time);
        osc.stop(time + durations[i]);

        time += durations[i];
      });
    } catch {
      // Audio not available, fail silently
    }
  }, [getAudioContext]);

  // Play a click/select sound
  const playClick = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio not available, fail silently
    }
  }, [getAudioContext]);

  return {
    playCorrect,
    playIncorrect,
    playVictory,
    playClick
  };
};

export default useSoundEffects;
