import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, Sparkles, Star, AlertTriangle } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import { formatDate, formatLocation } from '../utils/dateUtils';
import { GAME_CONFIG } from '../data/constants';
import { bounceIn } from '../utils/animations';
import useSoundEffects from '../hooks/useSoundEffects';
import useHaptics from '../hooks/useHaptics';
import Confetti from './Confetti';

// Floating particle animation for correct answers
const FloatingParticle = ({ delay, color }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: Math.random() * 8 + 4,
      height: Math.random() * 8 + 4,
      backgroundColor: color,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      y: [0, -30],
    }}
    transition={{
      duration: 1.5,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 2,
    }}
  />
);

// Animated stars burst for correct answers
const StarBurst = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute left-1/2 top-1/2"
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: [0, 1, 0],
          rotate: [0, 180],
          x: [0, Math.cos((i * Math.PI) / 4) * 100],
          y: [0, Math.sin((i * Math.PI) / 4) * 100],
        }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
      </motion.div>
    ))}
  </div>
);

// Shake animation for wrong answers
const shakeAnimation = {
  animate: {
    x: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
    transition: { duration: 0.6, ease: 'easeInOut' }
  }
};

// Pulse glow animation
const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(255,255,255,0.3)',
      '0 0 40px rgba(255,255,255,0.5)',
      '0 0 20px rgba(255,255,255,0.3)',
    ],
    transition: { duration: 1.5, repeat: Infinity }
  }
};

const FeedbackOverlay = () => {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const gameMode = useGameStore((state) => state.gameMode);
  const lastGuessCorrect = useGameStore((state) => state.lastGuessCorrect);
  const feedbackMessage = useGameStore((state) => state.feedbackMessage);
  const correctAnswer = useGameStore((state) => state.correctAnswer);
  const turnScore = useGameStore((state) => state.turnScore);
  const endTurn = useGameStore((state) => state.endTurn);
  const players = useGameStore((state) => state.players);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const isTieBreaker = useGameStore((state) => state.isTieBreaker);
  const pendingWinner = useGameStore((state) => state.pendingWinner);

  const { playCorrect, playIncorrect } = useSoundEffects();
  const { success: hapticSuccess, error: hapticError } = useHaptics();

  const isVisible = gamePhase === 'feedback';
  const nextPlayer = players[(currentPlayerIndex + 1) % 2];
  const isLocationMode = gameMode === GAME_CONFIG.MODES.LOCATION;

  // Play sound effect and haptic feedback when overlay appears
  useEffect(() => {
    if (isVisible) {
      if (lastGuessCorrect) {
        playCorrect();
        hapticSuccess();
      } else {
        playIncorrect();
        hapticError();
      }
    }
  }, [isVisible, lastGuessCorrect, playCorrect, playIncorrect, hapticSuccess, hapticError]);

  const handleContinue = () => {
    endTurn();
  };

  // Format the correct answer based on mode
  const formattedAnswer = correctAnswer
    ? (isLocationMode ? formatLocation(correctAnswer) : formatDate(correctAnswer))
    : '';

  const particleColors = lastGuessCorrect
    ? ['#4ade80', '#22c55e', '#86efac', '#fef08a', '#fde047']
    : ['#f87171', '#ef4444', '#fca5a5'];

  return (
    <>
      {/* Confetti for correct full answers (6 points = perfect) */}
      <Confetti active={isVisible && lastGuessCorrect && turnScore >= 6} count={60} />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleContinue}
          >
            <motion.div
              variants={lastGuessCorrect ? bounceIn : shakeAnimation}
              initial="hidden"
              animate={lastGuessCorrect ? "visible" : "animate"}
              exit="exit"
              className={`
                relative max-w-md w-full rounded-2xl p-8 text-center overflow-hidden
                ${lastGuessCorrect
                  ? 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700'
                  : 'bg-gradient-to-br from-red-500 via-rose-600 to-pink-700'
                }
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background particles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <FloatingParticle
                    key={i}
                    delay={i * 0.2}
                    color={particleColors[i % particleColors.length]}
                  />
                ))}
              </div>

              {/* Star burst for correct answers */}
              {lastGuessCorrect && <StarBurst />}

              {/* Animated glow border */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                variants={pulseGlow}
                animate="animate"
              />

              {/* Icon with enhanced animation */}
              <motion.div
                className="relative mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              >
                {lastGuessCorrect ? (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="relative">
                      <CheckCircle className="w-20 h-20 text-white mx-auto drop-shadow-lg" />
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 2.5, opacity: [0, 0.5, 0] }}
                        transition={{ duration: 0.8 }}
                      >
                        <Sparkles className="w-20 h-20 text-yellow-300" />
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <XCircle className="w-20 h-20 text-white mx-auto drop-shadow-lg" />
                  </motion.div>
                )}
              </motion.div>

              {/* Title with color animation */}
              <motion.h2
                className="text-3xl font-bold text-white mb-2 drop-shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {lastGuessCorrect ? (
                  <motion.span
                    animate={{ color: ['#ffffff', '#fef08a', '#ffffff'] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {turnScore >= 6 ? 'Perfect!' : 'Correct!'}
                  </motion.span>
                ) : (
                  'Wrong!'
                )}
              </motion.h2>

              {/* Message */}
              <motion.p
                className="text-white/90 mb-4 text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {feedbackMessage}
              </motion.p>

              {/* Show correct answer if wrong */}
              {!lastGuessCorrect && correctAnswer && (
                <motion.div
                  className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 mb-4 border border-white/30"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-white/70 text-sm">
                    The correct {isLocationMode ? 'location' : 'date'} was:
                  </p>
                  <p className="text-white font-bold text-xl">
                    {formattedAnswer}
                  </p>
                </motion.div>
              )}

              {/* Points earned with celebration animation */}
              {turnScore > 0 && (
                <motion.div
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                  className="relative mb-4"
                >
                  <motion.div
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full px-8 py-3 inline-block shadow-lg"
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(251,191,36,0.5)',
                        '0 0 30px rgba(251,191,36,0.8)',
                        '0 0 10px rgba(251,191,36,0.5)',
                      ],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span className="text-gray-900 font-black text-2xl">
                      +{turnScore} point{turnScore !== 1 ? 's' : ''}
                    </span>
                  </motion.div>

                  {/* Floating +points indicators */}
                  {[...Array(3)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute text-yellow-300 font-bold text-lg"
                      style={{ left: `${30 + i * 20}%` }}
                      initial={{ y: 0, opacity: 1 }}
                      animate={{ y: -50, opacity: 0 }}
                      transition={{ delay: 0.5 + i * 0.15, duration: 1 }}
                    >
                      +{turnScore}
                    </motion.span>
                  ))}
                </motion.div>
              )}

              {/* Next player indicator / Tie-breaker alert */}
              {isTieBreaker && pendingWinner ? (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="bg-orange-500/30 border border-orange-400/50 rounded-lg px-4 py-3 mb-2">
                    <div className="flex items-center justify-center gap-2 text-orange-300 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      TIE-BREAKER ROUND!
                    </div>
                    <p className="text-white/90 text-sm text-center">
                      <span className="font-bold">{pendingWinner.name}</span> reached {pendingWinner.score} points.
                    </p>
                    <p className="text-white/80 text-sm text-center">
                      <span className="font-bold text-white">{nextPlayer.name}</span> must match or beat to stay in the game!
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="text-white/80 text-sm mb-6 flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <ArrowRight className="w-4 h-4" />
                  Next up: <span className="font-bold text-white">{nextPlayer.name}</span>
                </motion.div>
              )}

              {/* Continue button */}
              <motion.button
                onClick={handleContinue}
                className="relative bg-white text-gray-800 font-bold px-10 py-4 rounded-xl
                           shadow-lg overflow-hidden group"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Continue</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-amber-200"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackOverlay;
