import { motion } from 'framer-motion';
import { RotateCcw, ImageOff } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import PlayerPanel from './PlayerPanel';
import PhotoDisplay from './PhotoDisplay';
import GuessingInterface from './GuessingInterface';
import FeedbackOverlay from './FeedbackOverlay';
import VictoryScreen from './VictoryScreen';
import { fadeInUp, bounceIn } from '../utils/animations';

const GameBoard = () => {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const players = useGameStore((state) => state.players);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const resetGame = useGameStore((state) => state.resetGame);

  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with current player turn */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-white mb-2">
            Photo Guessing Game
          </h1>
          <motion.p
            key={currentPlayer.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-white/70"
          >
            <span className="text-yellow-300 font-semibold">{currentPlayer.name}</span>'s turn
          </motion.p>
        </motion.div>

        {/* Main game layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Player 1 Panel - Left on desktop, first on mobile */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <PlayerPanel playerId={1} position="left" />
          </div>

          {/* Center content - Photo and Guessing */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 order-1 lg:order-2 space-y-4"
          >
            {/* Photo Display */}
            <PhotoDisplay />

            {/* Guessing Interface */}
            {gamePhase === 'playing' && <GuessingInterface />}
          </motion.div>

          {/* Player 2 Panel - Right on desktop, second on mobile */}
          <div className="lg:col-span-3 order-3">
            <PlayerPanel playerId={2} position="right" />
          </div>
        </div>

        {/* Footer with New Game button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <button
            onClick={resetGame}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/50
                       hover:text-white/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New Game
          </button>
        </motion.div>
      </div>

      {/* Overlays */}
      <FeedbackOverlay />
      {gamePhase === 'victory' && <VictoryScreen />}

      {/* No Photos Left Overlay */}
      {gamePhase === 'no_photos' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            variants={bounceIn}
            initial="hidden"
            animate="visible"
            className="max-w-md w-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-center"
          >
            <ImageOff className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">All Photos Used!</h2>
            <p className="text-white/80 mb-6">
              You've gone through all available photos without a winner.
            </p>

            {/* Final Scores */}
            <div className="bg-white/20 rounded-lg p-4 mb-6">
              <p className="text-white/70 text-sm mb-2">Final Scores</p>
              <div className="flex justify-around">
                {players.map((player) => (
                  <div key={player.id} className="text-center">
                    <p className="text-white font-semibold">{player.name}</p>
                    <p className="text-2xl font-bold text-yellow-300">{player.score}</p>
                  </div>
                ))}
              </div>
              {players[0].score !== players[1].score && (
                <p className="text-white mt-2">
                  {players[0].score > players[1].score ? players[0].name : players[1].name} wins!
                </p>
              )}
              {players[0].score === players[1].score && (
                <p className="text-white mt-2">It's a tie!</p>
              )}
            </div>

            <motion.button
              onClick={resetGame}
              className="bg-white text-gray-800 font-bold px-8 py-3 rounded-xl
                         hover:bg-white/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              New Game
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default GameBoard;
