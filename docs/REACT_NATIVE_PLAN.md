# React Native Implementation Plan for Photo Guessing Game

> **GitHub Issue:** [#219 — Photo Guessing Game: React Native mobile app implementation](https://github.com/geoffmyers/geoff-myers-mono-repo/issues/219)

This document outlines a comprehensive plan to implement a React Native mobile version alongside the existing React.js web version of the Photo Guessing Game.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Strategy](#2-architecture-strategy)
3. [Project Structure](#3-project-structure)
4. [Code Sharing Strategy](#4-code-sharing-strategy)
5. [Component Migration Guide](#5-component-migration-guide)
6. [Platform-Specific Considerations](#6-platform-specific-considerations)
7. [Navigation Implementation](#7-navigation-implementation)
8. [Styling Migration](#8-styling-migration)
9. [State Management](#9-state-management)
10. [Photo Handling](#10-photo-handling)
11. [Sound Effects](#11-sound-effects)
12. [Animations](#12-animations)
13. [Dependencies](#13-dependencies)
14. [Testing Strategy](#14-testing-strategy)
15. [Build and Deployment](#15-build-and-deployment)
16. [Implementation Phases](#16-implementation-phases)
17. [Risk Assessment](#17-risk-assessment)
18. [Appendix](#18-appendix)

---

## 1. Executive Summary

### Goal
Create a native mobile application (iOS and Android) that provides the same Photo Guessing Game experience as the web version, optimized for touch interactions and mobile device capabilities.

### Approach
Implement a **monorepo architecture** with maximum code sharing between web and mobile platforms using a shared package for business logic while maintaining platform-specific UI components.

### Key Benefits
- **Code Reuse**: ~60-70% shared code (state management, utilities, game logic)
- **Consistent Experience**: Same game rules, scoring, and features across platforms
- **Native Performance**: Platform-optimized animations and interactions
- **Offline Support**: Native photo library access, no server dependency

---

## 2. Architecture Strategy

### 2.1 Monorepo Structure

We'll use a **pnpm workspace** or **npm workspaces** monorepo to organize the codebase:

```
photo-date-guessing-game/
├── packages/
│   ├── shared/              # Shared business logic
│   │   ├── stores/          # Zustand stores
│   │   ├── utils/           # Utility functions
│   │   ├── hooks/           # Platform-agnostic hooks
│   │   ├── data/            # Constants, types
│   │   └── types/           # TypeScript definitions
│   │
│   ├── web/                 # React.js web app (existing)
│   │   ├── src/
│   │   │   ├── components/  # Web-specific components
│   │   │   └── main.jsx
│   │   ├── public/
│   │   └── package.json
│   │
│   └── mobile/              # React Native app (new)
│       ├── src/
│       │   ├── components/  # RN-specific components
│       │   ├── screens/     # Screen components
│       │   ├── navigation/  # React Navigation setup
│       │   └── App.tsx
│       ├── ios/
│       ├── android/
│       └── package.json
│
├── package.json             # Root workspace config
├── pnpm-workspace.yaml      # Workspace definition
└── README.md
```

### 2.2 Alternative: Simple Side-by-Side Structure

If monorepo complexity is not desired, use a simpler structure:

```
photo-date-guessing-game/
├── web/                     # Existing React.js app (renamed from src)
├── mobile/                  # New React Native app
├── shared/                  # Symlinked or copied shared code
└── package.json
```

### 2.3 Recommended Approach

**Start with the simple side-by-side structure**, then migrate to a proper monorepo once the mobile app is stable. This reduces initial complexity while still enabling code sharing.

---

## 3. Project Structure

### 3.1 Mobile App Structure (React Native)

```
mobile/
├── src/
│   ├── App.tsx                    # Root component with navigation
│   ├── components/
│   │   ├── common/                # Shared UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── GradientBackground.tsx
│   │   │
│   │   ├── game/                  # Game-specific components
│   │   │   ├── PhotoDisplay.tsx
│   │   │   ├── PlayerPanel.tsx
│   │   │   ├── GuessingInterface.tsx
│   │   │   ├── FeedbackOverlay.tsx
│   │   │   └── VictoryScreen.tsx
│   │   │
│   │   ├── selectors/             # Answer selection components
│   │   │   ├── YearSelector.tsx
│   │   │   ├── MonthSelector.tsx
│   │   │   ├── DaySelector.tsx
│   │   │   ├── CountrySelector.tsx
│   │   │   ├── StateSelector.tsx
│   │   │   └── CitySelector.tsx
│   │   │
│   │   └── animations/            # Animation components
│   │       ├── Confetti.tsx
│   │       └── FloatingParticles.tsx
│   │
│   ├── screens/
│   │   ├── SetupScreen.tsx        # Player setup & photo selection
│   │   ├── GameScreen.tsx         # Main game board
│   │   └── PhotoPickerScreen.tsx  # Photo library browser
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx       # React Navigation config
│   │
│   ├── hooks/
│   │   ├── usePhotoPicker.ts      # Native photo library access
│   │   ├── useSoundEffects.ts     # Native sound implementation
│   │   └── useHaptics.ts          # Haptic feedback
│   │
│   ├── services/
│   │   ├── photoService.ts        # EXIF extraction, storage
│   │   └── storageService.ts      # AsyncStorage wrapper
│   │
│   ├── utils/
│   │   └── platform.ts            # Platform detection utilities
│   │
│   └── theme/
│       ├── colors.ts
│       ├── spacing.ts
│       └── typography.ts
│
├── ios/                           # iOS native code
├── android/                       # Android native code
├── app.json                       # Expo/RN config
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── package.json
```

### 3.2 Shared Code Structure

```
shared/
├── stores/
│   └── gameStore.ts               # Zustand store (platform-agnostic)
│
├── utils/
│   ├── dateUtils.ts               # Date calculations, formatting
│   ├── gameLogic.ts               # Scoring, win conditions
│   └── shuffle.ts                 # Array shuffling
│
├── hooks/
│   └── useGameState.ts            # Game state selectors
│
├── data/
│   └── constants.ts               # Game constants
│
└── types/
    ├── game.ts                    # Game-related types
    ├── photo.ts                   # Photo metadata types
    └── player.ts                  # Player types
```

---

## 4. Code Sharing Strategy

### 4.1 What Can Be Shared (60-70%)

| Category | Files | Sharing Level |
|----------|-------|---------------|
| **State Management** | gameStore.js | 100% shared |
| **Game Logic** | dateUtils.js (checkGuess, scoring, phases) | 100% shared |
| **Constants** | constants.js | 100% shared |
| **Types** | TypeScript interfaces | 100% shared |
| **Utility Functions** | shuffleArray, formatDate, formatLocation | 100% shared |
| **Animation Configs** | Timing, easing values | 80% shared |

### 4.2 What Needs Platform-Specific Implementation (30-40%)

| Category | Web | React Native |
|----------|-----|--------------|
| **Components** | JSX + Tailwind | JSX + StyleSheet |
| **Animations** | Framer Motion | Reanimated / RN Animated |
| **Sound Effects** | Web Audio API | expo-av / react-native-sound |
| **Photo Access** | File input + manifest | expo-image-picker / CameraRoll |
| **EXIF Extraction** | exifr (browser) | expo-media-library / native modules |
| **Storage** | localStorage | AsyncStorage |
| **Navigation** | Conditional rendering | React Navigation |

### 4.3 Sharing Implementation

#### Option A: Symlinks (Simple)
```bash
# In mobile/src/
ln -s ../../shared ./shared
```

#### Option B: npm Workspace (Recommended)
```json
// Root package.json
{
  "name": "photo-guessing-game",
  "private": true,
  "workspaces": ["packages/*"]
}

// packages/mobile/package.json
{
  "dependencies": {
    "@photo-game/shared": "workspace:*"
  }
}
```

#### Option C: TypeScript Path Aliases
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  }
}
```

---

## 5. Component Migration Guide

### 5.1 Component Mapping

| Web Component | React Native Equivalent | Notes |
|---------------|------------------------|-------|
| `<div>` | `<View>` | All divs become Views |
| `<span>`, `<p>` | `<Text>` | All text must be in Text |
| `<button>` | `<TouchableOpacity>` or `<Pressable>` | Better feedback |
| `<input>` | `<TextInput>` | Different props |
| `<img>` | `<Image>` | Different source prop |
| `className=""` | `style={}` | StyleSheet objects |
| `onClick` | `onPress` | Touch events |
| `onMouseEnter/Leave` | N/A | Use Pressable states |
| `framer-motion` | `react-native-reanimated` | Different API |

### 5.2 Component Migration Examples

#### PlayerPanel - Web Version
```jsx
// Web (current)
<div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50
               rounded-2xl p-6 backdrop-blur-sm border border-white/10">
  <h3 className="text-xl font-bold text-white">{player.name}</h3>
  <div className="text-4xl font-bold text-white">{player.score}</div>
</div>
```

#### PlayerPanel - React Native Version
```tsx
// React Native
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const PlayerPanel = ({ player }) => (
  <LinearGradient
    colors={['rgba(30, 58, 138, 0.5)', 'rgba(88, 28, 135, 0.5)']}
    style={styles.container}
  >
    <Text style={styles.name}>{player.name}</Text>
    <Text style={styles.score}>{player.score}</Text>
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  score: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
});
```

### 5.3 Full Component Migration Checklist

- [ ] **App.jsx** → **App.tsx** + **AppNavigator.tsx**
- [ ] **SetupScreen.jsx** → **SetupScreen.tsx** (major rework for photo picker)
- [ ] **GameBoard.jsx** → **GameScreen.tsx**
- [ ] **PhotoDisplay.jsx** → **PhotoDisplay.tsx** (Image component)
- [ ] **PlayerPanel.jsx** → **PlayerPanel.tsx**
- [ ] **GuessingInterface.jsx** → **GuessingInterface.tsx**
- [ ] **YearSelector.jsx** → **YearSelector.tsx**
- [ ] **MonthSelector.jsx** → **MonthSelector.tsx**
- [ ] **DaySelector.jsx** → **DaySelector.tsx** (calendar grid)
- [ ] **CountrySelector.jsx** → **CountrySelector.tsx**
- [ ] **StateSelector.jsx** → **StateSelector.tsx**
- [ ] **CitySelector.jsx** → **CitySelector.tsx**
- [ ] **FeedbackOverlay.jsx** → **FeedbackOverlay.tsx** (modal)
- [ ] **VictoryScreen.jsx** → **VictoryScreen.tsx**
- [ ] **Confetti.jsx** → **Confetti.tsx** (Reanimated)

---

## 6. Platform-Specific Considerations

### 6.1 iOS Specific

| Feature | Implementation |
|---------|---------------|
| Photo Library Access | `expo-image-picker` or `@react-native-camera-roll/camera-roll` |
| EXIF Data | `expo-media-library` getAssetInfoAsync() |
| Haptic Feedback | `expo-haptics` |
| Status Bar | `expo-status-bar` (light content) |
| Safe Areas | `react-native-safe-area-context` |
| App Icons | 1024x1024 source, generate all sizes |
| Splash Screen | `expo-splash-screen` |

### 6.2 Android Specific

| Feature | Implementation |
|---------|---------------|
| Permissions | MEDIA_IMAGES, READ_EXTERNAL_STORAGE |
| Photo Library | Same libraries work |
| EXIF Data | May need `react-native-exif` for full support |
| Back Button | Handle with React Navigation |
| Status Bar | Translucent, light icons |
| Adaptive Icons | Foreground + background layers |

### 6.3 Permission Requests

```tsx
// iOS - Info.plist additions
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo Guessing Game needs access to your photos to play the game.</string>

// Android - AndroidManifest.xml
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

### 6.4 Deep Linking (Optional Future Feature)

```
photogame://game/start?mode=date
photogame://setup
```

---

## 7. Navigation Implementation

### 7.1 Navigation Structure

```
AppNavigator (Stack)
├── SetupScreen
├── PhotoPickerScreen
├── GameScreen
│   ├── FeedbackModal (overlay)
│   └── VictoryModal (overlay)
└── SettingsScreen (future)
```

### 7.2 React Navigation Setup

```tsx
// navigation/AppNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

export type RootStackParamList = {
  Setup: undefined;
  PhotoPicker: { mode: 'date' | 'location' };
  Game: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <Stack.Screen name="Setup" component={SetupScreen} />
      <Stack.Screen name="PhotoPicker" component={PhotoPickerScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
```

### 7.3 Screen Transitions

| Transition | Animation |
|------------|-----------|
| Setup → Game | Fade |
| Game → Victory | Scale + Fade (modal) |
| Any → PhotoPicker | Slide from bottom |

---

## 8. Styling Migration

### 8.1 Design Tokens

Create a centralized theme system to maintain consistency:

```tsx
// theme/colors.ts
export const colors = {
  // Background
  bgPrimary: '#0f172a',      // slate-900
  bgSecondary: '#1e293b',    // slate-800

  // Player colors
  player1: {
    primary: '#1e3a8a',      // blue-900
    secondary: '#581c87',    // purple-900
    accent: '#3b82f6',       // blue-500
  },
  player2: {
    primary: '#581c87',      // purple-900
    secondary: '#7c3aed',    // violet-600
    accent: '#a855f7',       // purple-500
  },

  // Feedback
  correct: '#22c55e',        // green-500
  incorrect: '#ef4444',      // red-500

  // UI
  white: '#ffffff',
  border: 'rgba(255, 255, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// theme/typography.ts
export const typography = {
  h1: { fontSize: 32, fontWeight: '800' as const },
  h2: { fontSize: 24, fontWeight: '700' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
};
```

### 8.2 Gradient Backgrounds

```tsx
// Using react-native-linear-gradient
import LinearGradient from 'react-native-linear-gradient';

const GradientBackground = ({ children }) => (
  <LinearGradient
    colors={['#0f172a', '#1e1b4b', '#0f172a']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={StyleSheet.absoluteFill}
  >
    {children}
  </LinearGradient>
);
```

### 8.3 Tailwind to StyleSheet Mapping

| Tailwind Class | StyleSheet Equivalent |
|----------------|----------------------|
| `p-4` | `padding: 16` |
| `rounded-2xl` | `borderRadius: 16` |
| `text-xl` | `fontSize: 20` |
| `font-bold` | `fontWeight: 'bold'` |
| `text-white` | `color: '#ffffff'` |
| `bg-white/10` | `backgroundColor: 'rgba(255,255,255,0.1)'` |
| `backdrop-blur-sm` | Use `@react-native-community/blur` |
| `grid-cols-7` | `FlatList` with `numColumns={7}` |
| `gap-2` | `columnGap: 8, rowGap: 8` (RN 0.71+) |

---

## 9. State Management

### 9.1 Zustand Store Migration

The Zustand store can be used almost as-is, with minor modifications:

```tsx
// shared/stores/gameStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Platform-specific storage adapter
const createStorage = () => {
  // Check if running in React Native
  if (typeof window === 'undefined' || !window.localStorage) {
    // React Native - use AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return createJSONStorage(() => AsyncStorage);
  }
  // Web - use localStorage
  return createJSONStorage(() => localStorage);
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      // ... existing store implementation
    }),
    {
      name: 'photo-date-game-storage',
      storage: createStorage(),
    }
  )
);
```

### 9.2 Store Modifications for Mobile

```tsx
// Additional mobile-specific state
interface MobileGameState extends GameState {
  // Photo URIs from device (not URLs)
  photoUris: string[];

  // Selected photos from picker
  selectedPhotos: PhotoAsset[];

  // Extracted metadata cache
  photoMetadata: Map<string, PhotoMetadata>;
}

// Additional actions
interface MobileActions {
  addPhotosFromDevice: (photos: PhotoAsset[]) => void;
  setPhotoMetadata: (uri: string, metadata: PhotoMetadata) => void;
  clearDevicePhotos: () => void;
}
```

### 9.3 Persistence Considerations

| Platform | Storage | Capacity | Notes |
|----------|---------|----------|-------|
| Web | localStorage | ~5MB | Sync, string only |
| iOS | AsyncStorage | ~6MB default | Async, string only |
| Android | AsyncStorage | Device dependent | Async, string only |

For large photo metadata, consider:
- Using `expo-file-system` for larger data
- Only persisting essential game state
- Re-extracting metadata on app launch

---

## 10. Photo Handling

### 10.1 Photo Selection Flow

```
User taps "Select Photos"
         ↓
Request permissions (if needed)
         ↓
Open photo picker (multi-select)
         ↓
For each selected photo:
  ├─ Get asset info (including EXIF)
  ├─ Extract date from EXIF
  ├─ Extract GPS coordinates
  └─ Reverse geocode (optional)
         ↓
Store photo URIs + metadata
         ↓
Validate minimum photos per mode
         ↓
Enable "Start Game" button
```

### 10.2 Photo Picker Implementation

```tsx
// hooks/usePhotoPicker.ts
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

export const usePhotoPicker = () => {
  const pickPhotos = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access.');
      return [];
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      exif: true, // Request EXIF data
    });

    if (result.canceled) return [];

    return result.assets;
  };

  return { pickPhotos };
};
```

### 10.3 EXIF Extraction

```tsx
// services/photoService.ts
import * as MediaLibrary from 'expo-media-library';

interface PhotoMetadata {
  date?: { year: number; month: number; day: number };
  location?: { country?: string; state?: string; city?: string };
  gps?: { latitude: number; longitude: number };
}

export const extractMetadata = async (asset: MediaLibrary.Asset): Promise<PhotoMetadata> => {
  const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);

  const metadata: PhotoMetadata = {};

  // Extract date
  if (assetInfo.creationTime) {
    const date = new Date(assetInfo.creationTime);
    metadata.date = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  // Extract GPS
  if (assetInfo.location) {
    metadata.gps = {
      latitude: assetInfo.location.latitude,
      longitude: assetInfo.location.longitude,
    };

    // Reverse geocode
    metadata.location = await reverseGeocode(
      assetInfo.location.latitude,
      assetInfo.location.longitude
    );
  }

  return metadata;
};
```

### 10.4 Reverse Geocoding

```tsx
// services/geocodingService.ts
import * as Location from 'expo-location';

export const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });

    if (results.length > 0) {
      const place = results[0];
      return {
        country: place.country,
        state: place.region,
        city: place.city || place.subregion,
      };
    }
  } catch (error) {
    console.warn('Geocoding failed:', error);
  }

  return undefined;
};
```

### 10.5 Photo Display

```tsx
// components/game/PhotoDisplay.tsx
import { Image, StyleSheet, View, Text } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

interface Props {
  uri: string;
  photoNumber: number;
  totalPhotos: number;
}

export const PhotoDisplay = ({ uri, photoNumber, totalPhotos }: Props) => (
  <Animated.View entering={ZoomIn.duration(500)} style={styles.container}>
    <Image source={{ uri }} style={styles.image} resizeMode="contain" />
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {photoNumber}/{totalPhotos}
      </Text>
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: 'white',
    fontWeight: '600',
  },
});
```

---

## 11. Sound Effects

### 11.1 Sound Implementation Options

| Option | Pros | Cons |
|--------|------|------|
| **expo-av** | Full Expo integration, easy setup | Larger bundle |
| **react-native-sound** | Lightweight | Manual linking |
| **expo-audio** (new) | Modern API | Newer, less documented |

### 11.2 Sound Effects Hook

```tsx
// hooks/useSoundEffects.ts
import { Audio } from 'expo-av';

// Pre-generated sound files or use synthesis
const soundFiles = {
  correct: require('../assets/sounds/correct.mp3'),
  incorrect: require('../assets/sounds/incorrect.mp3'),
  victory: require('../assets/sounds/victory.mp3'),
  click: require('../assets/sounds/click.mp3'),
};

export const useSoundEffects = () => {
  const sounds = useRef<Record<string, Audio.Sound>>({});

  useEffect(() => {
    // Preload sounds
    const loadSounds = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      for (const [key, source] of Object.entries(soundFiles)) {
        const { sound } = await Audio.Sound.createAsync(source);
        sounds.current[key] = sound;
      }
    };

    loadSounds();

    return () => {
      // Cleanup
      Object.values(sounds.current).forEach(sound => sound.unloadAsync());
    };
  }, []);

  const playCorrect = () => sounds.current.correct?.replayAsync();
  const playIncorrect = () => sounds.current.incorrect?.replayAsync();
  const playVictory = () => sounds.current.victory?.replayAsync();
  const playClick = () => sounds.current.click?.replayAsync();

  return { playCorrect, playIncorrect, playVictory, playClick };
};
```

### 11.3 Alternative: Audio Synthesis (No Sound Files)

```tsx
// Using react-native-audio-api (Web Audio API polyfill)
import { AudioContext } from 'react-native-audio-api';

const playCorrectSound = () => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Ascending arpeggio
  osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
  osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

  osc.start();
  osc.stop(ctx.currentTime + 0.4);
};
```

---

## 12. Animations

### 12.1 Animation Library Choice

**Recommendation: `react-native-reanimated` v3**

| Feature | Animated API | Reanimated |
|---------|-------------|------------|
| Performance | UI thread | Worklet thread |
| Gestures | Basic | Full integration |
| Layout animations | Manual | Automatic |
| Shared transitions | Complex | Built-in |
| Learning curve | Lower | Higher |

### 12.2 Animation Mapping

| Web (Framer Motion) | React Native (Reanimated) |
|---------------------|--------------------------|
| `initial={{ opacity: 0 }}` | `entering={FadeIn}` |
| `animate={{ opacity: 1 }}` | Built into entering |
| `exit={{ opacity: 0 }}` | `exiting={FadeOut}` |
| `transition={{ duration: 0.3 }}` | `.duration(300)` |
| `variants.stagger` | `entering={FadeIn.delay(index * 100)}` |
| `whileHover` | `Pressable` + `useAnimatedStyle` |
| `whileTap={{ scale: 0.95 }}` | `Pressable` + `useAnimatedStyle` |

### 12.3 Animation Examples

#### Fade In Animation
```tsx
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

<Animated.View entering={FadeIn.duration(300)} exiting={FadeOut}>
  {/* Content */}
</Animated.View>
```

#### Button Press Animation
```tsx
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Button = ({ onPress, children }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
      style={animatedStyle}
    >
      {children}
    </AnimatedPressable>
  );
};
```

#### Confetti Animation
```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

const ConfettiPiece = ({ color, startX, delay }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(800, { duration: 3000, easing: Easing.linear });
    translateX.value = withTiming(startX + Math.random() * 100 - 50, { duration: 3000 });
    rotate.value = withRepeat(withTiming(360, { duration: 1000 }), -1);
    opacity.value = withTiming(0, { duration: 3000 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.piece, { backgroundColor: color }, style]} />;
};
```

#### Shake Animation (Wrong Answer)
```tsx
const useShakeAnimation = () => {
  const translateX = useSharedValue(0);

  const shake = () => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { shake, animatedStyle };
};
```

---

## 13. Dependencies

### 13.1 Core Dependencies

```json
{
  "dependencies": {
    // React Native core
    "react": "18.2.0",
    "react-native": "0.73.x",

    // Navigation
    "@react-navigation/native": "^6.x",
    "@react-navigation/native-stack": "^6.x",
    "react-native-screens": "^3.x",
    "react-native-safe-area-context": "^4.x",

    // State management (shared with web)
    "zustand": "^5.0.9",

    // Storage
    "@react-native-async-storage/async-storage": "^1.x",

    // Animations
    "react-native-reanimated": "^3.x",
    "react-native-gesture-handler": "^2.x",

    // UI
    "react-native-linear-gradient": "^2.x",
    "@expo/vector-icons": "^14.x",

    // Media
    "expo-image-picker": "~15.x",
    "expo-media-library": "~16.x",
    "expo-av": "~14.x",
    "expo-haptics": "~13.x",
    "expo-location": "~17.x",

    // Utilities
    "expo-status-bar": "~1.x"
  },
  "devDependencies": {
    "@types/react": "~18.2.x",
    "typescript": "^5.x",
    "@babel/core": "^7.x",
    "react-native-reanimated": "^3.x"
  }
}
```

### 13.2 Expo vs Bare React Native

**Recommendation: Use Expo (Managed Workflow)**

| Aspect | Expo Managed | Bare RN |
|--------|-------------|---------|
| Setup complexity | Low | High |
| Native modules | Expo SDK | Manual linking |
| Build process | EAS Build | Xcode/Android Studio |
| OTA updates | Built-in | CodePush |
| App size | Larger | Smaller |
| Customization | Limited | Full |

For this app, **Expo Managed** is recommended because:
- All required features available in Expo SDK
- Faster development iteration
- Easier CI/CD with EAS
- No native code modifications needed

### 13.3 Package Compatibility Matrix

| Package | iOS | Android | Notes |
|---------|-----|---------|-------|
| expo-image-picker | ✅ | ✅ | Multi-select supported |
| expo-media-library | ✅ | ✅ | EXIF via getAssetInfoAsync |
| expo-av | ✅ | ✅ | Audio playback |
| expo-haptics | ✅ | ✅ | Haptic feedback |
| expo-location | ✅ | ✅ | Reverse geocoding |
| react-native-reanimated | ✅ | ✅ | v3+ |
| react-native-linear-gradient | ✅ | ✅ | Expo fork available |

---

## 14. Testing Strategy

### 14.1 Testing Pyramid

```
        ╱╲
       ╱  ╲     E2E Tests (Detox/Maestro)
      ╱────╲    - Full game flow
     ╱      ╲   - Photo selection
    ╱────────╲
   ╱          ╲   Integration Tests (React Native Testing Library)
  ╱────────────╲  - Screen navigation
 ╱              ╲ - Component interactions
╱────────────────╲
         │          Unit Tests (Jest)
         │          - Game logic
         │          - Utility functions
         │          - Store actions
```

### 14.2 Unit Tests

```tsx
// __tests__/utils/dateUtils.test.ts
import { checkGuess, getPointsForPhase, generateYearOptions } from '@shared/utils/dateUtils';

describe('dateUtils', () => {
  describe('checkGuess', () => {
    it('should return true for correct year guess', () => {
      const photo = { date: { year: 2023, month: 6, day: 15 } };
      expect(checkGuess('year', 2023, photo, 'date')).toBe(true);
    });

    it('should return false for incorrect year guess', () => {
      const photo = { date: { year: 2023, month: 6, day: 15 } };
      expect(checkGuess('year', 2022, photo, 'date')).toBe(false);
    });
  });

  describe('getPointsForPhase', () => {
    it('should return correct cumulative points', () => {
      expect(getPointsForPhase('year', 'date')).toBe(1);
      expect(getPointsForPhase('month', 'date')).toBe(3);
      expect(getPointsForPhase('day', 'date')).toBe(6);
    });
  });
});
```

### 14.3 Component Tests

```tsx
// __tests__/components/PlayerPanel.test.tsx
import { render, screen } from '@testing-library/react-native';
import { PlayerPanel } from '../src/components/game/PlayerPanel';

describe('PlayerPanel', () => {
  const mockPlayer = { id: 1, name: 'Alice', score: 5 };

  it('renders player name', () => {
    render(<PlayerPanel player={mockPlayer} isCurrentTurn={false} />);
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('renders player score', () => {
    render(<PlayerPanel player={mockPlayer} isCurrentTurn={false} />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('highlights current player', () => {
    render(<PlayerPanel player={mockPlayer} isCurrentTurn={true} />);
    // Check for highlighting styles
  });
});
```

### 14.4 E2E Tests

```tsx
// e2e/gameFlow.test.ts (Detox)
describe('Photo Guessing Game', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete setup and start game', async () => {
    // Enter player names
    await element(by.id('player1-input')).typeText('Alice');
    await element(by.id('player2-input')).typeText('Bob');

    // Select game mode
    await element(by.id('mode-date')).tap();

    // Select photos
    await element(by.id('select-photos-btn')).tap();
    // Handle photo picker...

    // Start game
    await element(by.id('start-game-btn')).tap();

    // Verify game screen
    await expect(element(by.id('game-board'))).toBeVisible();
  });
});
```

### 14.5 Test Configuration

```json
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|zustand)/)',
  ],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
  },
};
```

---

## 15. Build and Deployment

### 15.1 Development Workflow

```bash
# Initial setup
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npx expo install [dependencies...]

# Development
npx expo start          # Start Expo dev server
npx expo start --ios    # Start iOS simulator
npx expo start --android # Start Android emulator

# Testing
npm test               # Run Jest tests
npm run test:e2e       # Run Detox tests
```

### 15.2 Build Process (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for development
eas build --profile development --platform ios
eas build --profile development --platform android

# Build for production
eas build --profile production --platform all
```

### 15.3 EAS Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 15.4 App Store Deployment

#### iOS (App Store Connect)
1. Configure app in App Store Connect
2. Add required metadata, screenshots
3. Run `eas submit --platform ios`
4. Wait for App Review

#### Android (Google Play)
1. Create app in Google Play Console
2. Configure app signing (EAS manages this)
3. Run `eas submit --platform android`
4. Release to testing track first

### 15.5 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/mobile.yml
name: Mobile CI/CD

on:
  push:
    branches: [main]
    paths: ['mobile/**', 'shared/**']
  pull_request:
    paths: ['mobile/**', 'shared/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
        working-directory: ./mobile
      - run: npm test
        working-directory: ./mobile

  build:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --non-interactive --platform all
        working-directory: ./mobile
```

---

## 16. Implementation Phases

### Phase 1: Project Setup (1-2 days)
- [ ] Create Expo project with TypeScript
- [ ] Set up project structure
- [ ] Configure ESLint, Prettier
- [ ] Set up shared code structure
- [ ] Install core dependencies
- [ ] Configure navigation

**Deliverable:** Working Expo app with navigation shell

### Phase 2: Core Infrastructure (2-3 days)
- [ ] Migrate/adapt Zustand store
- [ ] Set up AsyncStorage persistence
- [ ] Create theme system (colors, typography, spacing)
- [ ] Build common UI components (Button, Card, etc.)
- [ ] Implement basic animations

**Deliverable:** Functional state management and UI foundation

### Phase 3: Photo Handling (2-3 days)
- [ ] Implement photo picker with permissions
- [ ] Build EXIF extraction service
- [ ] Implement reverse geocoding
- [ ] Create photo metadata storage
- [ ] Build PhotoDisplay component
- [ ] Handle photo loading states

**Deliverable:** Full photo selection and metadata extraction

### Phase 4: Setup Screen (1-2 days)
- [ ] Build player name inputs
- [ ] Build game mode selector
- [ ] Integrate photo picker
- [ ] Display photo statistics
- [ ] Implement validation logic
- [ ] Add start game button

**Deliverable:** Complete setup flow

### Phase 5: Game Screen - Core (3-4 days)
- [ ] Build GameScreen layout
- [ ] Build PlayerPanel components
- [ ] Build GuessingInterface container
- [ ] Build YearSelector
- [ ] Build MonthSelector
- [ ] Build DaySelector (calendar grid)
- [ ] Build CountrySelector
- [ ] Build StateSelector
- [ ] Build CitySelector

**Deliverable:** Playable game with all selectors

### Phase 6: Feedback & Victory (2-3 days)
- [ ] Build FeedbackOverlay modal
- [ ] Implement correct/incorrect animations
- [ ] Build floating particles effect
- [ ] Build VictoryScreen modal
- [ ] Implement confetti animation
- [ ] Implement trophy/crown animations

**Deliverable:** Complete game feedback loop

### Phase 7: Sound & Haptics (1 day)
- [ ] Create/obtain sound assets
- [ ] Implement useSoundEffects hook
- [ ] Implement useHaptics hook
- [ ] Integrate sounds into game flow
- [ ] Add settings for sound/haptics toggle

**Deliverable:** Full audio-visual feedback

### Phase 8: Polish & Testing (2-3 days)
- [ ] Write unit tests for game logic
- [ ] Write component tests
- [ ] Performance optimization
- [ ] Handle edge cases
- [ ] Test on multiple devices/OS versions
- [ ] Fix layout issues

**Deliverable:** Production-ready app

### Phase 9: Deployment (1-2 days)
- [ ] Configure EAS Build
- [ ] Create app icons and splash screen
- [ ] Write app store descriptions
- [ ] Create screenshots
- [ ] Submit to TestFlight/Play Store internal testing
- [ ] Address any review feedback

**Deliverable:** Apps in stores (internal testing)

### Total Estimated Effort: 15-23 days

---

## 17. Risk Assessment

### 17.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| EXIF extraction incomplete on some devices | Medium | High | Test on multiple devices; add manual date entry fallback |
| Reverse geocoding rate limits | Medium | Medium | Implement caching; batch requests |
| Animation performance issues | Low | Medium | Use native driver; optimize renders |
| Large photo libraries slow to load | Medium | Low | Implement pagination; lazy loading |
| AsyncStorage size limits | Low | Medium | Store minimal data; use file system for large data |

### 17.2 Platform Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| iOS photo permissions complexity | Medium | High | Clear permission prompts; graceful degradation |
| Android photo permissions (scoped storage) | Medium | High | Use expo-media-library; handle all API levels |
| App Store rejection | Low | High | Follow guidelines; test thoroughly |
| Expo SDK version conflicts | Low | Medium | Lock versions; test upgrades |

### 17.3 Scope Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Feature creep | Medium | Medium | Strict phase boundaries; MVP first |
| Underestimated complexity | Medium | Medium | Add buffer to estimates; cut scope if needed |
| Shared code conflicts | Low | Medium | Clear interfaces; abstraction layers |

---

## 18. Appendix

### 18.1 Useful Commands Reference

```bash
# Expo
npx expo start                    # Start dev server
npx expo start --clear            # Clear cache and start
npx expo prebuild                 # Generate native projects
npx expo run:ios                  # Build and run iOS
npx expo run:android              # Build and run Android

# EAS
eas build --platform ios          # Build iOS
eas build --platform android      # Build Android
eas submit --platform ios         # Submit to App Store
eas submit --platform android     # Submit to Play Store
eas update                        # Push OTA update

# Testing
npm test                          # Run Jest
npm test -- --coverage            # With coverage
npx detox test -c ios.sim.debug   # Run E2E tests
```

### 18.2 Debugging Tools

- **Flipper**: Network, layout, database inspection
- **React DevTools**: Component tree, props, state
- **Expo Dev Tools**: Logs, QR code, tunnel
- **Reactotron**: State snapshots, API monitoring

### 18.3 Useful Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)

### 18.4 Glossary

| Term | Definition |
|------|------------|
| **Expo** | Framework and platform for React Native apps |
| **EAS** | Expo Application Services - build and submit tools |
| **Metro** | JavaScript bundler for React Native |
| **Reanimated** | High-performance animation library |
| **Worklet** | JavaScript function that runs on UI thread |
| **EXIF** | Exchangeable Image File format - metadata standard |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-13 | Claude | Initial comprehensive plan |

---

*This plan provides a comprehensive roadmap for implementing the React Native version of Photo Guessing Game. Actual implementation may require adjustments based on discoveries during development.*
