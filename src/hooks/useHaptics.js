import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativePlatform } from '../services/platform';

/**
 * Hook for haptic feedback on native platforms
 * Gracefully degrades to no-op on web
 */
const useHaptics = () => {
  const isNative = isNativePlatform();

  /**
   * Light impact feedback - for button taps, selections
   */
  const lightTap = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics not available, fail silently
    }
  }, [isNative]);

  /**
   * Medium impact feedback - for confirmations, toggles
   */
  const mediumTap = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Haptics not available, fail silently
    }
  }, [isNative]);

  /**
   * Heavy impact feedback - for major actions
   */
  const heavyTap = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      // Haptics not available, fail silently
    }
  }, [isNative]);

  /**
   * Success notification feedback - for correct answers, wins
   */
  const success = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      // Haptics not available, fail silently
    }
  }, [isNative]);

  /**
   * Warning notification feedback - for warnings, alerts
   */
  const warning = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      // Haptics not available, fail silently
    }
  }, [isNative]);

  /**
   * Error notification feedback - for wrong answers, errors
   */
  const error = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      // Haptics not available, fail silently
    }
  }, [isNative]);

  /**
   * Selection changed feedback - for picker changes
   */
  const selectionChanged = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionChanged();
    } catch (err) {
      // Haptics not available, fail silently
    }
  }, [isNative]);

  /**
   * Custom vibration pattern
   * @param {number} duration - Duration in milliseconds
   */
  const vibrate = useCallback(async (duration = 300) => {
    if (!isNative) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (err) {
      // Haptics not available, fail silently
    }
  }, [isNative]);

  return {
    lightTap,
    mediumTap,
    heavyTap,
    success,
    warning,
    error,
    selectionChanged,
    vibrate,
    isSupported: isNative,
  };
};

export default useHaptics;
