import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import { generateLocationOptions } from '../utils/dateUtils';
import { staggerContainer, staggerItem } from '../utils/animations';

const CountrySelector = ({ onSelect }) => {
  const photos = useGameStore((state) => state.photos);
  const currentPhotoIndex = useGameStore((state) => state.currentPhotoIndex);
  const allCountries = useGameStore((state) => state.allCountries);

  const currentPhoto = photos[currentPhotoIndex];
  const correctCountry = currentPhoto?.location?.country;

  // Generate options including the correct answer
  const options = useMemo(() => {
    return generateLocationOptions(correctCountry, allCountries);
  }, [correctCountry, allCountries]);

  return (
    <div>
      <div className="flex items-center gap-2 text-white/80 mb-4">
        <Globe className="w-5 h-5" />
        <span className="font-medium">What country was this photo taken in?</span>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-2"
      >
        {options.map((country) => (
          <motion.button
            key={country}
            variants={staggerItem}
            onClick={() => onSelect(country)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40
                       rounded-xl py-3 px-4 text-white font-medium text-left
                       transition-colors duration-150"
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            {country}
          </motion.button>
        ))}
      </motion.div>

      <p className="text-white/50 text-sm text-center mt-4">
        Correct country earns +1 point
      </p>
    </div>
  );
};

export default CountrySelector;
