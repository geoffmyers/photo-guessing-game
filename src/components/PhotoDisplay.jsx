import { motion } from 'framer-motion';
import useGameStore from '../stores/gameStore';
import { photoReveal } from '../utils/animations';
import { getPhotoUrl } from '../services/capacitorPhotoService';

const PhotoDisplay = () => {
  const photos = useGameStore((state) => state.photos);
  const currentPhotoIndex = useGameStore((state) => state.currentPhotoIndex);
  const currentPhoto = photos[currentPhotoIndex];

  if (!currentPhoto) {
    return (
      <div className="bg-white/10 rounded-2xl p-8 flex items-center justify-center">
        <p className="text-white/50">No photo available</p>
      </div>
    );
  }

  // Get the display URL (handles both web URLs and native file paths)
  const imageSource = getPhotoUrl(currentPhoto) || currentPhoto.dataUrl;

  return (
    <motion.div
      key={currentPhoto.id}
      variants={photoReveal}
      initial="hidden"
      animate="visible"
      className="relative"
    >
      {/* Photo container with shadow and border */}
      <div className="relative bg-white p-2 rounded-xl shadow-2xl">
        <img
          src={imageSource}
          alt="Guess when this photo was taken!"
          className="w-full h-auto max-h-[50vh] object-contain rounded-lg"
          draggable={false}
        />

        {/* Photo counter badge */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
          {currentPhotoIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl opacity-20 blur-xl -z-10" />
    </motion.div>
  );
};

export default PhotoDisplay;
