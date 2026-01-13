import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../stores/gameStore';
import { GAME_CONFIG } from '../data/constants';
import YearSelector from './YearSelector';
import MonthSelector from './MonthSelector';
import DaySelector from './DaySelector';
import CountrySelector from './CountrySelector';
import StateSelector from './StateSelector';
import CitySelector from './CitySelector';
import { fadeIn } from '../utils/animations';
import useSoundEffects from '../hooks/useSoundEffects';

const GuessingInterface = () => {
  const guessPhase = useGameStore((state) => state.guessPhase);
  const gameMode = useGameStore((state) => state.gameMode);
  const submitGuess = useGameStore((state) => state.submitGuess);
  const turnScore = useGameStore((state) => state.turnScore);

  const { playClick } = useSoundEffects();

  const handleSelect = (value) => {
    playClick();
    submitGuess(value);
  };

  const isLocationMode = gameMode === GAME_CONFIG.MODES.LOCATION;

  // Define steps based on mode
  const steps = isLocationMode
    ? [
        { key: 'country', label: 'Country' },
        { key: 'state', label: 'State' },
        { key: 'city', label: 'City' }
      ]
    : [
        { key: 'year', label: 'Year' },
        { key: 'month', label: 'Month' },
        { key: 'day', label: 'Day' }
      ];

  const currentStepIndex = steps.findIndex(s => s.key === guessPhase);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((step, index) => (
          <div key={step.key} className="contents">
            <StepIndicator
              label={step.label}
              active={guessPhase === step.key}
              complete={index < currentStepIndex}
            />
            {index < steps.length - 1 && (
              <motion.div
                className={`flex-1 h-1 rounded ${index < currentStepIndex ? 'bg-green-500' : 'bg-white/20'}`}
                initial={index < currentStepIndex ? { scaleX: 0 } : {}}
                animate={index < currentStepIndex ? { scaleX: 1 } : {}}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current turn score */}
      {turnScore > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="text-center mb-4"
        >
          <motion.span
            className="inline-block bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold px-4 py-1 rounded-full text-sm shadow-lg"
            animate={{
              boxShadow: [
                '0 0 10px rgba(74,222,128,0.3)',
                '0 0 20px rgba(74,222,128,0.5)',
                '0 0 10px rgba(74,222,128,0.3)',
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Current turn: +{turnScore} point{turnScore !== 1 ? 's' : ''}
          </motion.span>
        </motion.div>
      )}

      {/* Phase-specific selector */}
      <AnimatePresence mode="wait">
        <motion.div
          key={guessPhase}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Date mode selectors */}
          {guessPhase === 'year' && <YearSelector onSelect={handleSelect} />}
          {guessPhase === 'month' && <MonthSelector onSelect={handleSelect} />}
          {guessPhase === 'day' && <DaySelector onSelect={handleSelect} />}

          {/* Location mode selectors */}
          {guessPhase === 'country' && <CountrySelector onSelect={handleSelect} />}
          {guessPhase === 'state' && <StateSelector onSelect={handleSelect} />}
          {guessPhase === 'city' && <CitySelector onSelect={handleSelect} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const StepIndicator = ({ label, active, complete }) => {
  return (
    <motion.div
      className={`
        flex flex-col items-center gap-1
        ${active ? 'text-white' : complete ? 'text-green-300' : 'text-white/40'}
      `}
      animate={active ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          transition-colors duration-200
          ${active
            ? 'bg-white text-blue-600'
            : complete
              ? 'bg-green-500 text-white'
              : 'bg-white/20 text-white/40'
          }
        `}
        animate={complete ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {complete ? '✓' : label.charAt(0)}
      </motion.div>
      <span className="text-xs font-medium">{label}</span>
    </motion.div>
  );
};

export default GuessingInterface;
