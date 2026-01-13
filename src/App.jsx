import { AnimatePresence, motion } from 'framer-motion';
import useGameStore from './stores/gameStore';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import { GAME_CONFIG } from './data/constants';

function App() {
  const gamePhase = useGameStore((state) => state.gamePhase);

  const isSetup = gamePhase === GAME_CONFIG.PHASES.SETUP;

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {isSetup ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <SetupScreen />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameBoard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
