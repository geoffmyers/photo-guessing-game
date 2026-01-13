import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, Check } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import { generateLocationOptions } from '../utils/dateUtils';
import { staggerContainer, staggerItem } from '../utils/animations';

const CitySelector = ({ onSelect }) => {
  const photos = useGameStore((state) => state.photos);
  const currentPhotoIndex = useGameStore((state) => state.currentPhotoIndex);
  const currentGuess = useGameStore((state) => state.currentGuess);
  const allCities = useGameStore((state) => state.allCities);

  const currentPhoto = photos[currentPhotoIndex];
  const correctCity = currentPhoto?.location?.city;

  // Generate options including the correct answer
  const options = useMemo(() => {
    return generateLocationOptions(correctCity, allCities);
  }, [correctCity, allCities]);

  return (
    <div>
      <div className="flex items-center gap-2 text-white/80 mb-2">
        <Building2 className="w-5 h-5" />
        <span className="font-medium">What city/town?</span>
      </div>

      {/* Show confirmed country and state */}
      <div className="flex items-center gap-4 text-green-300 text-sm mb-4">
        <div className="flex items-center gap-1">
          <Check className="w-4 h-4" />
          <span>Country: {currentGuess.country}</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-4 h-4" />
          <span>State: {currentGuess.state}</span>
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-2"
      >
        {options.map((city) => (
          <motion.button
            key={city}
            variants={staggerItem}
            onClick={() => onSelect(city)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40
                       rounded-xl py-3 px-4 text-white font-medium text-left
                       transition-colors duration-150"
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            {city}
          </motion.button>
        ))}
      </motion.div>

      <p className="text-white/50 text-sm text-center mt-4">
        Correct city earns +3 points (6 total)
      </p>
    </div>
  );
};

export default CitySelector;
