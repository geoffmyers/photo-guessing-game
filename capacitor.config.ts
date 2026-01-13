import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geoffmyers.photoguessinggame',
  appName: 'Photo Guessing Game',
  webDir: 'dist',
  server: {
    // Uncomment for development with live reload:
    // url: 'http://192.168.1.x:5173',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1e3a5f',
    preferredContentMode: 'mobile',
  },
  android: {
    backgroundColor: '#1e3a5f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1e3a5f',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1e3a5f',
    },
    Camera: {
      // Permissions are configured in native project files
    },
  },
};

export default config;
