import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useGameStore from './stores/gameStore';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import { GAME_CONFIG } from './data/constants';
import { isElectron } from './services/platform';

function App() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const resetGame = useGameStore((state) => state.resetGame);

  const isSetup = gamePhase === GAME_CONFIG.PHASES.SETUP;

  // Wire macOS native menu items (Cmd+N New Game, Cmd+O Select Photos) to app actions.
  useEffect(() => {
    if (!isElectron()) return;
    const unsubscribe = window.electronAPI.menu.onEvent((event) => {
      if (event === 'new-game') {
        resetGame();
      } else if (event === 'select-photos') {
        // PhotoLoader subscribes to this DOM event when mounted on the setup screen.
        window.dispatchEvent(new CustomEvent('pgg:select-photos'));
      }
    });
    return unsubscribe;
  }, [resetGame]);

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
