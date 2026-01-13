import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import { generateYearOptions } from '../utils/dateUtils';
import { staggerContainer, staggerItem } from '../utils/animations';

const CURRENT_YEAR = new Date().getFullYear();

const YearSelector = ({ onSelect }) => {
  const photos = useGameStore((state) => state.photos);
  const currentPhotoIndex = useGameStore((state) => state.currentPhotoIndex);
  const currentPhoto = photos[currentPhotoIndex];

  // Generate year options - memoized to prevent reshuffling on re-renders
  // Sort in ascending chronological order
  const yearOptions = useMemo(() => {
    if (!currentPhoto) return [];
    const options = generateYearOptions(currentPhoto.date.year);
    return options.sort((a, b) => a - b);
  }, [currentPhoto?.id]);

  if (!currentPhoto) return null;

  // Calculate years ago for display
  const getYearsAgo = (year) => {
    const diff = CURRENT_YEAR - year;
    if (diff === 0) return 'this year';
    if (diff === 1) return 'last year';
    return `${diff} years ago`;
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-white/80 mb-4">
        <Calendar className="w-5 h-5" />
        <span className="font-medium">When was this photo taken?</span>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-4 gap-2"
      >
        {yearOptions.map((year) => (
          <motion.button
            key={year}
            variants={staggerItem}
            onClick={() => onSelect(year)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40
                       rounded-xl py-3 px-2 text-white
                       transition-colors duration-150 flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="font-bold text-lg">{year}</span>
            <span className="text-white/50 text-xs mt-0.5">({getYearsAgo(year)})</span>
          </motion.button>
        ))}
      </motion.div>

      <p className="text-white/50 text-sm text-center mt-3">
        Guess the year to earn 1 point
      </p>
    </div>
  );
};

export default YearSelector;
