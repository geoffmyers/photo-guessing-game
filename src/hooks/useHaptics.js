import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isCapacitorNative } from '../services/platform';

/**
 * Hook for haptic feedback.
 *
 * - Capacitor (iOS/Android): full taptic engine support via @capacitor/haptics.
 * - Electron (macOS): currently no-op. Electron does not expose programmatic
 *   trackpad haptics via NSHapticFeedbackManager; a future native helper could
 *   bridge it. Calls remain valid (graceful degradation) so renderer code does
 *   not need platform branches.
 * - Web: no-op.
 */
const useHaptics = () => {
  const isSupported = isCapacitorNative();

  const lightTap = useCallback(async () => {
    if (!isSupported) return;
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
  }, [isSupported]);

  const mediumTap = useCallback(async () => {
    if (!isSupported) return;
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
  }, [isSupported]);

  const heavyTap = useCallback(async () => {
    if (!isSupported) return;
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
  }, [isSupported]);

  const success = useCallback(async () => {
    if (!isSupported) return;
    try { await Haptics.notification({ type: NotificationType.Success }); } catch {}
  }, [isSupported]);

  const warning = useCallback(async () => {
    if (!isSupported) return;
    try { await Haptics.notification({ type: NotificationType.Warning }); } catch {}
  }, [isSupported]);

  const error = useCallback(async () => {
    if (!isSupported) return;
    try { await Haptics.notification({ type: NotificationType.Error }); } catch {}
  }, [isSupported]);

  const selectionChanged = useCallback(async () => {
    if (!isSupported) return;
    try { await Haptics.selectionChanged(); } catch {}
  }, [isSupported]);

  const vibrate = useCallback(async (duration = 300) => {
    if (!isSupported) return;
    try { await Haptics.vibrate({ duration }); } catch {}
  }, [isSupported]);

  return {
    lightTap,
    mediumTap,
    heavyTap,
    success,
    warning,
    error,
    selectionChanged,
    vibrate,
    isSupported,
  };
};

export default useHaptics;
