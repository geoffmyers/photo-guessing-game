import { motion } from 'framer-motion';
import { Trophy, User, AlertTriangle } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import { GAME_CONFIG } from '../data/constants';

const PlayerPanel = ({ playerId, position }) => {
  const players = useGameStore((state) => state.players);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const isTieBreaker = useGameStore((state) => state.isTieBreaker);
  const pendingWinner = useGameStore((state) => state.pendingWinner);

  const playerIndex = playerId - 1;
  const player = players[playerIndex];
  const isActive = currentPlayerIndex === playerIndex;
  const scoreProgress = (player.score / GAME_CONFIG.WINNING_SCORE) * 100;

  // Check if this player is the pending winner (reached winning score first)
  const isPendingWinner = isTieBreaker && pendingWinner && pendingWinner.id === player.id;

  const colors = playerIndex === 0
    ? { bg: 'from-blue-600 to-blue-700', accent: 'blue', ring: 'ring-blue-400' }
    : { bg: 'from-purple-600 to-purple-700', accent: 'purple', ring: 'ring-purple-400' };

  return (
    <motion.div
      className={`
        relative bg-gradient-to-br ${colors.bg} rounded-2xl p-4 shadow-lg
        ${isActive ? `ring-4 ${colors.ring} ring-opacity-50` : 'opacity-70'}
        ${isTieBreaker && isActive ? 'ring-4 ring-orange-400 ring-opacity-70' : ''}
        transition-all duration-300
      `}
      animate={isActive ? { scale: 1.02 } : { scale: 1 }}
    >
      {/* Active indicator */}
      {isActive && !isTieBreaker && (
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          YOUR TURN
        </motion.div>
      )}

      {/* Tie-breaker indicator */}
      {isActive && isTieBreaker && (
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1"
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
        >
          <AlertTriangle className="w-3 h-3" />
          TIE-BREAKER!
        </motion.div>
      )}

      {/* Pending winner indicator */}
      {isPendingWinner && !isActive && (
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {pendingWinner.score} TO BEAT
        </motion.div>
      )}

      {/* Player info */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center`}>
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{player.name}</h3>
          <p className="text-white/60 text-sm">Player {playerId}</p>
        </div>
      </div>

      {/* Score display */}
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-5 h-5 text-yellow-300" />
        <span className="text-2xl font-bold text-white">{player.score}</span>
        <span className="text-white/50 text-sm">/ {GAME_CONFIG.WINNING_SCORE}</span>
      </div>

      {/* Score progress bar */}
      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${scoreProgress}%` }}
          transition={{ type: 'spring', damping: 15 }}
        />
      </div>

      {/* Points to win */}
      <p className="text-white/50 text-xs mt-2 text-center">
        {GAME_CONFIG.WINNING_SCORE - player.score} points to win
      </p>
    </motion.div>
  );
};

export default PlayerPanel;
