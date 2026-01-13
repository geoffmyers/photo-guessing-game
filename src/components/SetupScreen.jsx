import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Users, Play, AlertCircle, Calendar, MapPin } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import PhotoLoader from './PhotoLoader';
import { GAME_CONFIG } from '../data/constants';
import { fadeInUp, bounceIn, staggerContainer, staggerItem } from '../utils/animations';

const SetupScreen = () => {
  const players = useGameStore((state) => state.players);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const allPhotos = useGameStore((state) => state.allPhotos);
  const gameMode = useGameStore((state) => state.gameMode);
  const setGameMode = useGameStore((state) => state.setGameMode);
  const startGame = useGameStore((state) => state.startGame);

  const [error, setError] = useState('');

  // Count photos available for each mode
  const datePhotosCount = allPhotos.filter(p => p.date).length;
  const locationPhotosCount = allPhotos.filter(p => p.location?.country).length;

  const currentModePhotos = gameMode === GAME_CONFIG.MODES.LOCATION
    ? locationPhotosCount
    : datePhotosCount;

  const handleStartGame = () => {
    // Validate player names
    if (!players[0].name.trim() || !players[1].name.trim()) {
      setError('Please enter names for both players');
      return;
    }

    // Validate photo count for selected mode
    if (currentModePhotos < GAME_CONFIG.MIN_PHOTOS_TO_START) {
      const modeLabel = gameMode === GAME_CONFIG.MODES.LOCATION ? 'location data' : 'date data';
      setError(`Need at least ${GAME_CONFIG.MIN_PHOTOS_TO_START} photos with ${modeLabel}`);
      return;
    }

    setError('');
    const success = startGame();
    if (!success) {
      setError('Failed to start game. Check photo requirements.');
    }
  };

  const canStart = players[0].name.trim() &&
    players[1].name.trim() &&
    currentModePhotos >= GAME_CONFIG.MIN_PHOTOS_TO_START;

  const isDateModeAvailable = datePhotosCount >= GAME_CONFIG.MIN_PHOTOS_TO_START;
  const isLocationModeAvailable = locationPhotosCount >= GAME_CONFIG.MIN_PHOTOS_TO_START;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-4 shadow-lg"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Camera className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Photo Guessing Game
          </h1>
          <p className="text-white/70">
            Can you guess when and where photos were taken?
          </p>
        </motion.div>

        {/* Game Mode Selection */}
        <motion.div
          variants={fadeInUp}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6"
        >
          <h2 className="font-semibold text-white mb-4">Game Mode</h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Date Mode */}
            <motion.button
              onClick={() => setGameMode(GAME_CONFIG.MODES.DATE)}
              disabled={!isDateModeAvailable}
              className={`
                relative p-4 rounded-xl border-2 transition-all
                ${gameMode === GAME_CONFIG.MODES.DATE
                  ? 'border-amber-400 bg-amber-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/40'
                }
                ${!isDateModeAvailable ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              whileHover={isDateModeAvailable ? { scale: 1.02 } : {}}
              whileTap={isDateModeAvailable ? { scale: 0.98 } : {}}
            >
              <Calendar className={`w-8 h-8 mx-auto mb-2 ${gameMode === GAME_CONFIG.MODES.DATE ? 'text-amber-400' : 'text-white/70'}`} />
              <div className={`font-medium ${gameMode === GAME_CONFIG.MODES.DATE ? 'text-amber-400' : 'text-white'}`}>
                Date Mode
              </div>
              <div className="text-xs text-white/50 mt-1">
                Year → Month → Day
              </div>
              <div className={`text-xs mt-2 ${datePhotosCount >= 3 ? 'text-green-400' : 'text-red-400'}`}>
                {datePhotosCount} photos
              </div>
            </motion.button>

            {/* Location Mode */}
            <motion.button
              onClick={() => setGameMode(GAME_CONFIG.MODES.LOCATION)}
              disabled={!isLocationModeAvailable}
              className={`
                relative p-4 rounded-xl border-2 transition-all
                ${gameMode === GAME_CONFIG.MODES.LOCATION
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/40'
                }
                ${!isLocationModeAvailable ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              whileHover={isLocationModeAvailable ? { scale: 1.02 } : {}}
              whileTap={isLocationModeAvailable ? { scale: 0.98 } : {}}
            >
              <MapPin className={`w-8 h-8 mx-auto mb-2 ${gameMode === GAME_CONFIG.MODES.LOCATION ? 'text-blue-400' : 'text-white/70'}`} />
              <div className={`font-medium ${gameMode === GAME_CONFIG.MODES.LOCATION ? 'text-blue-400' : 'text-white'}`}>
                Location Mode
              </div>
              <div className="text-xs text-white/50 mt-1">
                Country → State → City
              </div>
              <div className={`text-xs mt-2 ${locationPhotosCount >= 3 ? 'text-green-400' : 'text-red-400'}`}>
                {locationPhotosCount} photos
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Player Names */}
        <motion.div
          variants={fadeInUp}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 text-white mb-4">
            <Users className="w-5 h-5" />
            <h2 className="font-semibold">Players</h2>
          </div>

          <div className="space-y-4">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                variants={staggerItem}
                className="flex items-center gap-3"
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                  ${index === 0 ? 'bg-blue-500' : 'bg-purple-500'}
                `}>
                  {index + 1}
                </div>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => setPlayerName(player.id, e.target.value)}
                  placeholder={`Player ${index + 1} name`}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                  maxLength={20}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Photo Loader */}
        <motion.div
          variants={fadeInUp}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 text-white mb-4">
            <Camera className="w-5 h-5" />
            <h2 className="font-semibold">Photos</h2>
            <span className="text-white/50 text-sm">
              (min. {GAME_CONFIG.MIN_PHOTOS_TO_START} required)
            </span>
          </div>

          <PhotoLoader />
        </motion.div>

        {/* Rules Summary */}
        <motion.div
          variants={fadeInUp}
          className="bg-white/5 rounded-xl p-4 mb-6 text-white/70 text-sm"
        >
          <h3 className="font-medium text-white/90 mb-2">How to Play:</h3>
          {gameMode === GAME_CONFIG.MODES.DATE ? (
            <ul className="space-y-1">
              <li>• Guess the year, month, and day a photo was taken</li>
              <li>• Correct year: +1 point, + month: +3 total, + day: +6 total</li>
              <li>• Wrong guess ends your turn</li>
              <li>• First to {GAME_CONFIG.WINNING_SCORE} points wins!</li>
            </ul>
          ) : (
            <ul className="space-y-1">
              <li>• Guess the country, state, and city where a photo was taken</li>
              <li>• Correct country: +1 point, + state: +3 total, + city: +6 total</li>
              <li>• Wrong guess ends your turn</li>
              <li>• First to {GAME_CONFIG.WINNING_SCORE} points wins!</li>
            </ul>
          )}
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-300 bg-red-500/20 rounded-lg px-4 py-3 mb-4"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Start Button */}
        <motion.button
          variants={bounceIn}
          onClick={handleStartGame}
          disabled={!canStart}
          className={`
            w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg
            transition-all duration-200
            ${canStart
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 shadow-lg hover:shadow-xl'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
            }
          `}
          whileHover={canStart ? { scale: 1.02 } : {}}
          whileTap={canStart ? { scale: 0.98 } : {}}
        >
          <Play className="w-6 h-6" />
          Start {gameMode === GAME_CONFIG.MODES.LOCATION ? 'Location' : 'Date'} Game
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SetupScreen;
