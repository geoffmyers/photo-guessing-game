# Capacitor Implementation Plan for Photo Guessing Game

This document outlines a simpler alternative to the full React Native rewrite: using Capacitor to package the existing React.js web app as a native iOS/Android app.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Approach Comparison](#2-approach-comparison)
3. [Architecture Overview](#3-architecture-overview)
4. [Implementation Steps](#4-implementation-steps)
5. [Required Code Changes](#5-required-code-changes)
6. [Native Plugins](#6-native-plugins)
7. [Platform Configuration](#7-platform-configuration)
8. [Build and Deployment](#8-build-and-deployment)
9. [Limitations and Trade-offs](#9-limitations-and-trade-offs)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Executive Summary

### Goal
Package the existing React.js Photo Guessing Game as a native iOS and Android app with minimal code changes.

### Approach
Use **Capacitor** to wrap the web app in a native WebView while adding native functionality through plugins.

### Key Benefits
- **~90% code reuse** - Keep existing React + Vite + Tailwind codebase
- **2-3 days effort** vs 15-23 days for React Native
- **Single codebase** - Web, iOS, and Android from same source
- **Native features** - Camera, file system, haptics via plugins
- **App Store ready** - Produces real native apps

---

## 2. Approach Comparison

### Capacitor vs React Native

| Aspect | Capacitor | React Native |
|--------|-----------|--------------|
| **Code reuse** | ~90% | ~60-70% |
| **Development time** | 2-3 days | 15-23 days |
| **Learning curve** | Minimal | Significant |
| **Native UI** | WebView (web components) | True native components |
| **Performance** | Good | Excellent |
| **App size** | ~15-25 MB | ~20-40 MB |
| **Animation smoothness** | Good (keeps Framer Motion) | Excellent (Reanimated) |
| **Maintenance** | Single codebase | Two UI implementations |

### When to Choose Capacitor
- Existing web app works well
- Timeline is short
- Team knows web technologies
- Native UI not critical
- Want single codebase

### When to Choose React Native
- Need truly native UI feel
- Performance-critical animations
- Heavy use of platform-specific features
- Building primarily for mobile

---

## 3. Architecture Overview

### Current Web Architecture
```
photo-date-guessing-game/
├── src/
│   ├── components/        # React components
│   ├── stores/            # Zustand state
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utilities
│   └── main.jsx           # Entry point
├── public/
│   └── photos/            # Photo manifest
├── scripts/
│   └── generate-manifest.js
├── vite.config.js
└── package.json
```

### With Capacitor Added
```
photo-date-guessing-game/
├── src/                   # Unchanged React app
├── public/
├── ios/                   # Generated iOS project
│   ├── App/
│   │   ├── App.xcodeproj
│   │   └── Podfile
│   └── ...
├── android/               # Generated Android project
│   ├── app/
│   └── ...
├── capacitor.config.ts    # Capacitor configuration
├── vite.config.js
└── package.json
```

### How It Works
```
┌─────────────────────────────────────────────────┐
│                  Native App Shell               │
│  ┌───────────────────────────────────────────┐  │
│  │              WKWebView (iOS)              │  │
│  │         WebView (Android)                 │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │     Your React App (unchanged)      │  │  │
│  │  │   - Components                      │  │  │
│  │  │   - Tailwind CSS                    │  │  │
│  │  │   - Framer Motion                   │  │  │
│  │  │   - Zustand                         │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │           Capacitor Bridge                │  │
│  │  - Camera/Photo Library                   │  │
│  │  - File System                            │  │
│  │  - Haptics                                │  │
│  │  - Storage                                │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 4. Implementation Steps

### Step 1: Install Capacitor

```bash
cd reactjs-projects/photo-date-guessing-game

# Install Capacitor core
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init "Photo Guessing Game" com.geoffmyers.photoguessinggame
```

### Step 2: Configure Capacitor

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geoffmyers.photoguessinggame',
  appName: 'Photo Guessing Game',
  webDir: 'dist',
  server: {
    // For development - load from dev server
    // url: 'http://localhost:5173',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
  },
  android: {
    backgroundColor: '#0f172a',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0f172a',
    },
  },
};

export default config;
```

### Step 3: Add Platforms

```bash
# Install platform packages
npm install @capacitor/ios @capacitor/android

# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android
```

### Step 4: Install Required Plugins

```bash
# Camera and photo library access
npm install @capacitor/camera

# File system access
npm install @capacitor/filesystem

# Persistent storage
npm install @capacitor/preferences

# Haptic feedback
npm install @capacitor/haptics

# Status bar control
npm install @capacitor/status-bar

# Splash screen
npm install @capacitor/splash-screen

# EXIF data extraction (community plugin)
npm install @nickartemenko/capacitor-exif
```

### Step 5: Build and Sync

```bash
# Build the web app
npm run build

# Copy web assets to native projects
npx cap sync
```

### Step 6: Open in Xcode

```bash
# Open iOS project in Xcode
npx cap open ios

# Or for Android
npx cap open android
```

---

## 5. Required Code Changes

### 5.1 Photo Loading Service

Replace the manifest-based loading with Capacitor Camera plugin:

```typescript
// src/services/capacitorPhotoService.ts
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface PhotoWithMetadata {
  id: string;
  uri: string;
  webPath: string;
  date?: { year: number; month: number; day: number };
  location?: { country?: string; state?: string; city?: string };
}

export const pickPhotosFromLibrary = async (limit: number = 20): Promise<PhotoWithMetadata[]> => {
  // Request permission
  const permission = await Camera.requestPermissions({ permissions: ['photos'] });

  if (permission.photos !== 'granted') {
    throw new Error('Photo library permission denied');
  }

  // Pick multiple photos
  const result = await Camera.pickImages({
    quality: 90,
    limit,
  });

  // Process each photo
  const photos: PhotoWithMetadata[] = await Promise.all(
    result.photos.map(async (photo, index) => {
      const metadata = await extractPhotoMetadata(photo);
      return {
        id: `photo-${Date.now()}-${index}`,
        uri: photo.path || '',
        webPath: photo.webPath || '',
        ...metadata,
      };
    })
  );

  return photos;
};

// Platform detection helper
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};
```

### 5.2 EXIF Extraction

```typescript
// src/services/exifService.ts
import ExifReader from '@nickartemenko/capacitor-exif';
import { Capacitor } from '@capacitor/core';

interface PhotoMetadata {
  date?: { year: number; month: number; day: number };
  location?: { country?: string; state?: string; city?: string };
  gps?: { latitude: number; longitude: number };
}

export const extractPhotoMetadata = async (photo: { path?: string }): Promise<PhotoMetadata> => {
  if (!photo.path) return {};

  try {
    const exifData = await ExifReader.getExif({ path: photo.path });

    const metadata: PhotoMetadata = {};

    // Extract date
    if (exifData.DateTimeOriginal) {
      const dateStr = exifData.DateTimeOriginal;
      // Format: "2023:06:15 14:30:00"
      const [datePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split(':').map(Number);
      metadata.date = { year, month, day };
    }

    // Extract GPS
    if (exifData.GPSLatitude && exifData.GPSLongitude) {
      metadata.gps = {
        latitude: parseFloat(exifData.GPSLatitude),
        longitude: parseFloat(exifData.GPSLongitude),
      };

      // Reverse geocode
      metadata.location = await reverseGeocode(
        metadata.gps.latitude,
        metadata.gps.longitude
      );
    }

    return metadata;
  } catch (error) {
    console.warn('EXIF extraction failed:', error);
    return {};
  }
};

const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`
    );
    const data = await response.json();

    return {
      country: data.address?.country,
      state: data.address?.state,
      city: data.address?.city || data.address?.town || data.address?.village,
    };
  } catch {
    return undefined;
  }
};
```

### 5.3 Update PhotoLoader Component

```tsx
// src/components/PhotoLoader.jsx
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { pickPhotosFromLibrary, isNativePlatform } from '../services/capacitorPhotoService';
import useGameStore from '../stores/gameStore';

const PhotoLoader = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { loadPhotos, allPhotos } = useGameStore();

  const handleLoadPhotos = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isNativePlatform()) {
        // Native: use Capacitor Camera
        const photos = await pickPhotosFromLibrary(20);
        loadPhotos(photos);
      } else {
        // Web: use existing manifest approach
        const response = await fetch('/photos/manifest.json');
        const manifest = await response.json();
        loadPhotos(manifest.photos);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleLoadPhotos}
        disabled={loading}
        className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600
                   rounded-xl font-semibold text-white"
      >
        {loading ? 'Loading...' : isNativePlatform() ? 'Select Photos' : 'Load Photos'}
      </button>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {allPhotos.length > 0 && (
        <p className="text-white/70">
          {allPhotos.length} photos loaded
        </p>
      )}
    </div>
  );
};

export default PhotoLoader;
```

### 5.4 Update Storage to Use Capacitor Preferences

```typescript
// src/stores/gameStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Capacitor storage adapter
const capacitorStorage = {
  getItem: async (name) => {
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: async (name, value) => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name) => {
    await Preferences.remove({ key: name });
  },
};

// Choose storage based on platform
const storage = Capacitor.isNativePlatform()
  ? createJSONStorage(() => capacitorStorage)
  : createJSONStorage(() => localStorage);

export const useGameStore = create(
  persist(
    (set, get) => ({
      // ... existing store implementation
    }),
    {
      name: 'photo-date-game-storage',
      storage,
    }
  )
);
```

### 5.5 Add Haptic Feedback

```typescript
// src/hooks/useHaptics.ts
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const useHaptics = () => {
  const isNative = Capacitor.isNativePlatform();

  const lightTap = async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  const mediumTap = async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  };

  const success = async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Success });
    }
  };

  const error = async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Error });
    }
  };

  return { lightTap, mediumTap, success, error };
};
```

### 5.6 Integrate Haptics into Game

```tsx
// In FeedbackOverlay.jsx or similar
import { useHaptics } from '../hooks/useHaptics';

const FeedbackOverlay = ({ isCorrect }) => {
  const { success, error } = useHaptics();

  useEffect(() => {
    if (isCorrect) {
      success();
    } else {
      error();
    }
  }, [isCorrect]);

  // ... rest of component
};
```

### 5.7 Update PhotoDisplay for Native URIs

```tsx
// src/components/PhotoDisplay.jsx
import { Capacitor } from '@capacitor/core';

const PhotoDisplay = ({ photo }) => {
  // Handle both web URLs and native file URIs
  const imageSource = Capacitor.isNativePlatform()
    ? Capacitor.convertFileSrc(photo.uri)
    : photo.webPath || `/photos/${photo.filename}`;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <img
        src={imageSource}
        alt="Guess the date"
        className="w-full h-full object-contain"
      />
    </div>
  );
};
```

---

## 6. Native Plugins

### Plugin Summary

| Plugin | Purpose | Usage |
|--------|---------|-------|
| `@capacitor/camera` | Photo library access | Pick photos for game |
| `@capacitor/filesystem` | File system access | Read photo files |
| `@capacitor/preferences` | Key-value storage | Game state persistence |
| `@capacitor/haptics` | Vibration feedback | Correct/wrong haptics |
| `@capacitor/status-bar` | Status bar styling | Dark theme status bar |
| `@capacitor/splash-screen` | App launch screen | Branded splash |
| `@nickartemenko/capacitor-exif` | EXIF extraction | Get photo dates/GPS |

### iOS Permissions (Info.plist)

These are automatically added when you sync, but verify they exist:

```xml
<!-- ios/App/App/Info.plist -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo Guessing Game needs access to your photos to play the game.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Photo Guessing Game needs access to save photos.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Photo Guessing Game uses location to enhance gameplay.</string>
```

### Android Permissions (AndroidManifest.xml)

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

---

## 7. Platform Configuration

### 7.1 iOS Configuration

#### App Icons
Create icons at these sizes and place in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024

Or use a tool: https://appicon.co/

#### Splash Screen
```typescript
// capacitor.config.ts
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    launchAutoHide: true,
    backgroundColor: '#0f172a',
    showSpinner: false,
    iosSpinnerStyle: 'small',
    spinnerColor: '#ffffff',
  },
}
```

#### Status Bar
```typescript
// In your App.jsx or main entry
import { StatusBar, Style } from '@capacitor/status-bar';

// Set status bar style on app load
StatusBar.setStyle({ style: Style.Dark });
StatusBar.setBackgroundColor({ color: '#0f172a' });
```

### 7.2 Android Configuration

#### App Theme
```xml
<!-- android/app/src/main/res/values/styles.xml -->
<style name="AppTheme" parent="Theme.AppCompat.NoActionBar">
    <item name="android:statusBarColor">#0f172a</item>
    <item name="android:navigationBarColor">#0f172a</item>
    <item name="android:windowLightStatusBar">false</item>
</style>
```

### 7.3 Safe Area Handling

Add CSS for notched devices:

```css
/* src/index.css */
:root {
  --sat: env(safe-area-inset-top);
  --sab: env(safe-area-inset-bottom);
  --sal: env(safe-area-inset-left);
  --sar: env(safe-area-inset-right);
}

body {
  padding-top: var(--sat);
  padding-bottom: var(--sab);
  padding-left: var(--sal);
  padding-right: var(--sar);
}
```

---

## 8. Build and Deployment

### 8.1 Development Workflow

```bash
# Start web dev server
npm run dev

# In capacitor.config.ts, enable dev server:
# server: { url: 'http://192.168.1.x:5173', cleartext: true }

# Sync and run on device
npx cap sync
npx cap run ios        # Run on connected iOS device
npx cap run android    # Run on connected Android device
```

### 8.2 Production Build

```bash
# Build web app for production
npm run build

# Sync to native projects
npx cap sync

# Open in Xcode for iOS build
npx cap open ios

# Open in Android Studio for Android build
npx cap open android
```

### 8.3 iOS App Store Submission

1. Open project in Xcode: `npx cap open ios`
2. Select "Any iOS Device" as target
3. Product → Archive
4. Window → Organizer → Distribute App
5. Follow App Store Connect prompts

### 8.4 Google Play Submission

1. Open project in Android Studio: `npx cap open android`
2. Build → Generate Signed Bundle/APK
3. Choose Android App Bundle
4. Create or select keystore
5. Upload to Google Play Console

### 8.5 CI/CD with GitHub Actions

```yaml
# .github/workflows/capacitor-build.yml
name: Capacitor Build

on:
  push:
    branches: [main]
    paths:
      - 'reactjs-projects/photo-date-guessing-game/**'

jobs:
  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./reactjs-projects/photo-date-guessing-game
        run: npm ci

      - name: Build web app
        working-directory: ./reactjs-projects/photo-date-guessing-game
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: web-build
          path: ./reactjs-projects/photo-date-guessing-game/dist

  build-ios:
    needs: build-web
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Download web build
        uses: actions/download-artifact@v4
        with:
          name: web-build
          path: ./reactjs-projects/photo-date-guessing-game/dist

      - name: Install dependencies
        working-directory: ./reactjs-projects/photo-date-guessing-game
        run: npm ci

      - name: Sync Capacitor
        working-directory: ./reactjs-projects/photo-date-guessing-game
        run: npx cap sync ios

      - name: Build iOS
        working-directory: ./reactjs-projects/photo-date-guessing-game/ios/App
        run: |
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath build/App.xcarchive \
            archive
```

---

## 9. Limitations and Trade-offs

### 9.1 What Works Well
- All existing UI components
- Tailwind CSS styling
- Framer Motion animations
- Zustand state management
- Sound effects (Web Audio API works in WebView)
- Touch interactions

### 9.2 Potential Issues

| Issue | Impact | Mitigation |
|-------|--------|------------|
| WebView performance | Animations may be slightly less smooth | Use CSS transforms, reduce particle counts |
| Memory with many photos | Large photo sets may cause issues | Limit selection to 20-30 photos |
| EXIF extraction reliability | Some photo formats may not work | Fallback to file creation date |
| Offline geocoding | Requires network | Cache results, graceful degradation |

### 9.3 Features Not Available
- True native UI components
- Native navigation gestures
- Background processing
- Widget/Today View extensions
- Apple Watch companion

### 9.4 When to Consider React Native Instead
- Users complain about "web app feel"
- Animation performance is unacceptable
- Need native UI components
- Want to add significant native features

---

## 10. Implementation Phases

### Phase 1: Setup (2-3 hours)
- [ ] Install Capacitor and CLI
- [ ] Initialize Capacitor project
- [ ] Add iOS and Android platforms
- [ ] Install required plugins
- [ ] Configure capacitor.config.ts
- [ ] Test basic build and sync

### Phase 2: Photo Service (3-4 hours)
- [ ] Create capacitorPhotoService.ts
- [ ] Implement photo picker with permissions
- [ ] Add EXIF extraction
- [ ] Implement reverse geocoding
- [ ] Update PhotoLoader component
- [ ] Update PhotoDisplay for native URIs
- [ ] Test photo selection flow

### Phase 3: Storage & State (1-2 hours)
- [ ] Create Capacitor storage adapter
- [ ] Update Zustand store for cross-platform
- [ ] Test state persistence
- [ ] Verify game state survives app restart

### Phase 4: Native Enhancements (1-2 hours)
- [ ] Add haptic feedback hook
- [ ] Integrate haptics into game events
- [ ] Configure status bar
- [ ] Add splash screen
- [ ] Handle safe areas

### Phase 5: Polish & Testing (2-3 hours)
- [ ] Test on multiple iOS devices
- [ ] Test on multiple Android devices
- [ ] Fix any layout issues
- [ ] Optimize performance if needed
- [ ] Test offline behavior

### Phase 6: App Store Assets (1-2 hours)
- [ ] Create app icons (all sizes)
- [ ] Create splash screen
- [ ] Take screenshots for store listings
- [ ] Write app descriptions
- [ ] Prepare privacy policy

### Phase 7: Deployment (1-2 hours)
- [ ] Build release version
- [ ] Submit to TestFlight
- [ ] Submit to Google Play internal testing
- [ ] Address any review feedback

### Total Estimated Effort: 2-3 days

---

## Appendix: Quick Reference Commands

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init "Photo Guessing Game" com.geoffmyers.photoguessinggame

# Add platforms
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android

# Install plugins
npm install @capacitor/camera @capacitor/filesystem @capacitor/preferences
npm install @capacitor/haptics @capacitor/status-bar @capacitor/splash-screen

# Build and sync
npm run build
npx cap sync

# Development
npx cap open ios        # Open in Xcode
npx cap open android    # Open in Android Studio
npx cap run ios         # Build and run on device
npx cap run android     # Build and run on device

# Update after web changes
npm run build && npx cap sync
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-13 | Claude | Initial Capacitor plan |

---

*This plan provides a simpler, faster path to native mobile apps by wrapping the existing web application. For a more native experience, see REACT_NATIVE_PLAN.md.*
