import { motion } from 'framer-motion';
import { CalendarCheck, Check } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import { MONTH_NAMES, getDaysInMonth } from '../utils/dateUtils';
import { staggerContainer, staggerItem } from '../utils/animations';

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DaySelector = ({ onSelect }) => {
  const currentGuess = useGameStore((state) => state.currentGuess);

  const { year, month } = currentGuess;
  const daysInMonth = getDaysInMonth(month, year);

  // Get the day of week for the 1st of the month (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  // Build calendar grid with empty cells for alignment
  const calendarCells = [];

  // Add empty cells before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ day: null, key: `empty-${i}` });
  }

  // Add the actual days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push({ day, key: `day-${day}` });
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-white/80 mb-2">
        <CalendarCheck className="w-5 h-5" />
        <span className="font-medium">What day?</span>
      </div>

      {/* Show confirmed year and month */}
      <div className="flex items-center gap-4 text-green-300 text-sm mb-4">
        <div className="flex items-center gap-1">
          <Check className="w-4 h-4" />
          <span>Year: {year}</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-4 h-4" />
          <span>Month: {MONTH_NAMES[month - 1]}</span>
        </div>
      </div>

      {/* Calendar header with month/year */}
      <div className="text-center text-white font-semibold mb-3">
        {MONTH_NAMES[month - 1]} {year}
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_HEADERS.map((header) => (
          <div
            key={header}
            className="text-center text-white/60 text-xs font-medium py-1"
          >
            {header}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-7 gap-1"
      >
        {calendarCells.map(({ day, key }) => (
          day === null ? (
            <div key={key} className="py-2" />
          ) : (
            <motion.button
              key={key}
              variants={staggerItem}
              onClick={() => onSelect(day)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40
                         rounded-lg py-2 text-white font-medium text-sm
                         transition-colors duration-150"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {day}
            </motion.button>
          )
        ))}
      </motion.div>

      <p className="text-white/50 text-sm text-center mt-3">
        Correct day earns +3 points (6 total)
      </p>
    </div>
  );
};

export default DaySelector;
