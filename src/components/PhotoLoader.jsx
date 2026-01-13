import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, AlertCircle, RefreshCw, Calendar, MapPin, ImagePlus, Loader2 } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import { bounceIn, staggerContainer, staggerItem } from '../utils/animations';
import { isNativePlatform } from '../services/platform';
import { pickPhotosFromLibrary, getPhotoUrl } from '../services/capacitorPhotoService';
import { extractMetadataFromPhotos } from '../services/exifService';
import useHaptics from '../hooks/useHaptics';

const PhotoLoader = () => {
  const allPhotos = useGameStore((state) => state.allPhotos);
  const loadPhotos = useGameStore((state) => state.loadPhotos);
  const [loading, setLoading] = useState(false);
  const [extractingMetadata, setExtractingMetadata] = useState(false);
  const [metadataProgress, setMetadataProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [stats, setStats] = useState({ dateCount: 0, locationCount: 0 });

  const { lightTap, success, error: hapticError } = useHaptics();
  const isNative = isNativePlatform();

  // Load photos from manifest (web) or prompt user to select (native)
  const loadFromManifest = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch the manifest file from public/photos
      const response = await fetch('/photos/manifest.json');

      if (!response.ok) {
        throw new Error('manifest.json not found. Run: npm run generate-manifest');
      }

      const manifest = await response.json();

      if (!manifest.photos || Object.keys(manifest.photos).length === 0) {
        throw new Error('No photos in manifest. Add photos to public/photos/ and run: npm run generate-manifest');
      }

      // Convert manifest to photo objects with new structure
      const photoArray = Object.entries(manifest.photos).map(([filename, data], index) => ({
        id: `photo-${index}-${Date.now()}`,
        fileName: filename,
        url: `/photos/${filename}`,
        date: data.date || null,
        location: data.location || null,
        gps: data.gps || null
      }));

      // Calculate stats
      const dateCount = photoArray.filter(p => p.date).length;
      const locationCount = photoArray.filter(p => p.location?.country).length;
      setStats({ dateCount, locationCount });

      loadPhotos(photoArray);
      setHasLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle native photo selection
  const handleSelectPhotos = async () => {
    lightTap();
    setLoading(true);
    setError(null);

    try {
      // Pick photos from library
      const photos = await pickPhotosFromLibrary(30);

      if (photos.length === 0) {
        setLoading(false);
        return; // User cancelled
      }

      // Extract metadata from photos
      setExtractingMetadata(true);
      setMetadataProgress({ current: 0, total: photos.length });

      const photosWithMetadata = await extractMetadataFromPhotos(photos, (current, total) => {
        setMetadataProgress({ current, total });
      });

      setExtractingMetadata(false);

      // Calculate stats
      const dateCount = photosWithMetadata.filter(p => p.date).length;
      const locationCount = photosWithMetadata.filter(p => p.location?.country).length;
      setStats({ dateCount, locationCount });

      loadPhotos(photosWithMetadata);
      setHasLoaded(true);
      success();
    } catch (err) {
      hapticError();
      setError(err.message);
    } finally {
      setLoading(false);
      setExtractingMetadata(false);
    }
  };

  // Auto-load on mount (web only)
  useEffect(() => {
    if (!hasLoaded && allPhotos.length === 0 && !isNative) {
      loadFromManifest();
    }
  }, [hasLoaded, allPhotos.length, isNative]);

  // Update stats when photos change
  useEffect(() => {
    if (allPhotos.length > 0) {
      const dateCount = allPhotos.filter(p => p.date).length;
      const locationCount = allPhotos.filter(p => p.location?.country).length;
      setStats({ dateCount, locationCount });
    }
  }, [allPhotos]);

  // Get the display URL for a photo (handles both web and native)
  const getDisplayUrl = (photo) => getPhotoUrl(photo);

  return (
    <div className="w-full">
      {/* Status display */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center
          transition-colors duration-200
          ${loading ? 'border-blue-400 bg-blue-500/20' : 'border-white/30 bg-white/5'}
        `}
      >
        <div className="flex flex-col items-center gap-3">
          {loading || extractingMetadata ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              {extractingMetadata ? (
                <Loader2 className="w-10 h-10 text-blue-300" />
              ) : (
                <RefreshCw className="w-10 h-10 text-blue-300" />
              )}
            </motion.div>
          ) : isNative ? (
            <ImagePlus className="w-10 h-10 text-white/70" />
          ) : (
            <FolderOpen className="w-10 h-10 text-white/70" />
          )}

          <div className="text-white/90 font-medium">
            {extractingMetadata
              ? `Extracting metadata... ${metadataProgress.current}/${metadataProgress.total}`
              : loading
                ? isNative
                  ? 'Selecting photos...'
                  : 'Loading photos from public/photos...'
                : allPhotos.length > 0
                  ? `${allPhotos.length} photos loaded`
                  : isNative
                    ? 'Select photos from your library'
                    : 'Photos loaded from public/photos folder'
            }
          </div>

          {!loading && !extractingMetadata && (
            <div className="text-white/50 text-sm">
              {isNative ? (
                'Tap below to select photos with date/location data'
              ) : (
                <>Add photos to <code className="bg-white/10 px-2 py-0.5 rounded">public/photos/</code> and restart dev server</>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Action button */}
      {!loading && !extractingMetadata && (
        <motion.button
          onClick={isNative ? handleSelectPhotos : loadFromManifest}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4
                     bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
                     border border-white/20 rounded-xl text-white font-medium transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isNative ? (
            <>
              <ImagePlus className="w-5 h-5" />
              {allPhotos.length > 0 ? 'Select Different Photos' : 'Select Photos'}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Reload Photos
            </>
          )}
        </motion.button>
      )}

      {/* Photo stats */}
      <AnimatePresence>
        {allPhotos.length > 0 && (
          <motion.div
            variants={bounceIn}
            initial="hidden"
            animate="visible"
            className="mt-4 grid grid-cols-2 gap-2"
          >
            <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${stats.dateCount >= 3 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{stats.dateCount} with dates</span>
            </div>
            <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${stats.locationCount >= 3 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{stats.locationCount} with GPS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo thumbnails */}
      <AnimatePresence>
        {allPhotos.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-4 flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto"
          >
            {allPhotos.slice(0, 12).map((photo) => (
              <motion.div
                key={photo.id}
                variants={staggerItem}
                className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/20"
              >
                <img
                  src={getDisplayUrl(photo)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            ))}
            {allPhotos.length > 12 && (
              <motion.div
                variants={staggerItem}
                className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-white/70 text-sm font-medium"
              >
                +{allPhotos.length - 12}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-red-500/20 border border-red-400/30 rounded-lg p-3"
          >
            <div className="flex items-start gap-2 text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Error loading photos</span>
                <p className="text-red-200/70 text-sm mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoLoader;
