import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Map, Check } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import { generateLocationOptions } from '../utils/dateUtils';
import { staggerContainer, staggerItem } from '../utils/animations';

const StateSelector = ({ onSelect }) => {
  const photos = useGameStore((state) => state.photos);
  const currentPhotoIndex = useGameStore((state) => state.currentPhotoIndex);
  const currentGuess = useGameStore((state) => state.currentGuess);
  const allStates = useGameStore((state) => state.allStates);

  const currentPhoto = photos[currentPhotoIndex];
  const correctState = currentPhoto?.location?.state;

  // Generate options including the correct answer
  const options = useMemo(() => {
    return generateLocationOptions(correctState, allStates);
  }, [correctState, allStates]);

  return (
    <div>
      <div className="flex items-center gap-2 text-white/80 mb-2">
        <Map className="w-5 h-5" />
        <span className="font-medium">What state/province?</span>
      </div>

      {/* Show confirmed country */}
      <div className="flex items-center gap-2 text-green-300 text-sm mb-4">
        <Check className="w-4 h-4" />
        <span>Country: {currentGuess.country}</span>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-2"
      >
        {options.map((state) => (
          <motion.button
            key={state}
            variants={staggerItem}
            onClick={() => onSelect(state)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40
                       rounded-xl py-3 px-4 text-white font-medium text-left
                       transition-colors duration-150"
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            {state}
          </motion.button>
        ))}
      </motion.div>

      <p className="text-white/50 text-sm text-center mt-4">
        Correct state earns +2 points (3 total)
      </p>
    </div>
  );
};

export default StateSelector;
