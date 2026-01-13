import { motion } from 'framer-motion';
import { CalendarDays, Check } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import { MONTH_NAMES } from '../utils/dateUtils';
import { staggerContainer, staggerItem } from '../utils/animations';

const MonthSelector = ({ onSelect }) => {
  const currentGuess = useGameStore((state) => state.currentGuess);

  return (
    <div>
      <div className="flex items-center gap-2 text-white/80 mb-2">
        <CalendarDays className="w-5 h-5" />
        <span className="font-medium">What month?</span>
      </div>

      {/* Show confirmed year */}
      <div className="flex items-center gap-2 text-green-300 text-sm mb-4">
        <Check className="w-4 h-4" />
        <span>Year: {currentGuess.year}</span>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-2"
      >
        {MONTH_NAMES.map((month, index) => (
          <motion.button
            key={month}
            variants={staggerItem}
            onClick={() => onSelect(index + 1)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40
                       rounded-xl py-3 px-2 text-white font-medium text-sm
                       transition-colors duration-150"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {month}
          </motion.button>
        ))}
      </motion.div>

      <p className="text-white/50 text-sm text-center mt-3">
        Correct month earns +2 points (3 total)
      </p>
    </div>
  );
};

export default MonthSelector;
