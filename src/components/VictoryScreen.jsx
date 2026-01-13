import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw, Star, Crown, Sparkles } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import { bounceIn, victoryBounce } from '../utils/animations';
import useSoundEffects from '../hooks/useSoundEffects';
import Confetti from './Confetti';

const VictoryScreen = () => {
  const winner = useGameStore((state) => state.winner);
  const players = useGameStore((state) => state.players);
  const gameMode = useGameStore((state) => state.gameMode);
  const resetGame = useGameStore((state) => state.resetGame);

  const { playVictory } = useSoundEffects();

  // Play victory fanfare when screen appears
  useEffect(() => {
    if (winner) {
      playVictory();
    }
  }, [winner, playVictory]);

  if (!winner) return null;

  const loser = players.find((p) => p.id !== winner.id);
  const isLocationMode = gameMode === 'location';

  return (
    <>
      {/* Big confetti celebration */}
      <Confetti active={true} count={100} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center z-50 p-4 overflow-hidden"
      >
        {/* Animated background stars */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
              y: -20,
              rotate: 0,
              scale: 0.5 + Math.random() * 0.5,
            }}
            animate={{
              y: (typeof window !== 'undefined' ? window.innerHeight : 600) + 20,
              rotate: 360,
              transition: {
                duration: 3 + Math.random() * 4,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: 'linear'
              }
            }}
          >
            <Star
              className="text-yellow-400"
              style={{
                width: 12 + Math.random() * 24,
                height: 12 + Math.random() * 24,
                opacity: 0.4 + Math.random() * 0.4,
              }}
              fill="currentColor"
            />
          </motion.div>
        ))}

        {/* Sparkle bursts in corners */}
        {[0, 1, 2, 3].map((corner) => (
          <motion.div
            key={corner}
            className="absolute"
            style={{
              top: corner < 2 ? '10%' : '80%',
              left: corner % 2 === 0 ? '10%' : '80%',
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.7, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3,
              delay: corner * 0.5,
              repeat: Infinity,
            }}
          >
            <Sparkles className="w-16 h-16 text-yellow-300" />
          </motion.div>
        ))}

        <motion.div
          variants={bounceIn}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-3xl p-8 text-center relative overflow-hidden"
        >
          {/* Animated gradient border */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            animate={{
              boxShadow: [
                '0 0 30px rgba(251,191,36,0.3), inset 0 0 30px rgba(251,191,36,0.1)',
                '0 0 60px rgba(251,191,36,0.5), inset 0 0 60px rgba(251,191,36,0.2)',
                '0 0 30px rgba(251,191,36,0.3), inset 0 0 30px rgba(251,191,36,0.1)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Crown animation */}
          <motion.div
            className="absolute -top-4 left-1/2 transform -translate-x-1/2"
            initial={{ y: -50, opacity: 0, rotate: -20 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          >
            <Crown className="w-12 h-12 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
          </motion.div>

          {/* Trophy with glow */}
          <motion.div
            variants={victoryBounce}
            animate="animate"
            className="mb-6 relative"
          >
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-32 h-32 bg-yellow-400/30 rounded-full blur-xl" />
            </motion.div>
            <motion.div
              className="relative inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-full shadow-2xl"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(251,191,36,0.5)',
                  '0 0 40px rgba(251,191,36,0.8)',
                  '0 0 20px rgba(251,191,36,0.5)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Trophy className="w-14 h-14 text-white drop-shadow-lg" />
            </motion.div>
          </motion.div>

          {/* Winner announcement with rainbow effect */}
          <motion.h1
            className="text-5xl font-black mb-2 drop-shadow-lg"
            initial={{ opacity: 0, y: 20, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <motion.span
              className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              {winner.name}
            </motion.span>
          </motion.h1>

          <motion.h2
            className="text-3xl font-bold text-white mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Wins!
          </motion.h2>

          <motion.p
            className="text-white/70 text-lg mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isLocationMode
              ? 'Amazing geography skills!'
              : 'Incredible memory for dates!'}
          </motion.p>

          {/* Final scores with enhanced styling */}
          <motion.div
            className="grid grid-cols-2 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {/* Winner card */}
            <motion.div
              className="relative bg-gradient-to-br from-green-500/40 to-emerald-600/40 border-2 border-green-400/60 rounded-xl p-4 overflow-hidden"
              animate={{
                borderColor: ['rgba(74,222,128,0.6)', 'rgba(74,222,128,1)', 'rgba(74,222,128,0.6)'],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="flex items-center justify-center gap-1 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-green-300 text-sm font-bold">Champion</span>
              </div>
              <p className="text-white font-bold truncate text-lg">{winner.name}</p>
              <motion.p
                className="text-4xl font-black text-white"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, delay: 1, repeat: 3 }}
              >
                {winner.score}
              </motion.p>
            </motion.div>

            {/* Runner up card */}
            <div className="bg-white/10 rounded-xl p-4">
              <div className="mb-2">
                <span className="text-white/50 text-sm font-medium">Runner Up</span>
              </div>
              <p className="text-white/80 font-semibold truncate">{loser?.name}</p>
              <p className="text-3xl font-bold text-white/60">{loser?.score}</p>
            </div>
          </motion.div>

          {/* Play again button with shimmer effect */}
          <motion.button
            onClick={resetGame}
            className="relative flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg overflow-hidden group"
            whileHover={{ scale: 1.02, boxShadow: '0 10px 40px rgba(16,185,129,0.4)' }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Play Again
            </span>
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
};

export default VictoryScreen;
