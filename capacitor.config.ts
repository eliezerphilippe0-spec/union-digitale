import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ht.uniondigitale.app',
  appName: 'Union Digitale',
  webDir: 'dist',
  
  // Server configuration
  server: {
    // For development with live reload
    // url: 'http://192.168.1.x:5173',
    cleartext: false,
    androidScheme: 'https',
  },

  // Android specific configuration
  android: {
    // Allow mixed content for older Android versions
    allowMixedContent: false,
    // Custom splash screen
    backgroundColor: '#f97316',
    // Build settings
    buildOptions: {
      keystorePath: 'release-key.keystore',
      keystoreAlias: 'uniondigitale',
    },
  },

  // iOS specific configuration  
  ios: {
    // Custom scheme for deep links
    scheme: 'uniondigitale',
    backgroundColor: '#f97316',
    // Content inset
    contentInset: 'automatic',
  },

  // Plugins configuration
  plugins: {
    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Local Notifications
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#f97316',
      sound: 'notification.wav',
    },

    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#f97316',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerStyle: 'large',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
    },

    // Status Bar
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f97316',
    },

    // Keyboard
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },

    // App
    App: {
      // Deep link domains
      // Will handle: uniondigitale://*, https://uniondigitale.ht/*
    },

    // Share
    Share: {
      // For sharing products/links
    },

    // Camera (for KYC, profile photos)
    Camera: {
      // Photo quality
    },

    // Geolocation (for shipping address)
    Geolocation: {
      // Location settings
    },

    // Browser (for external payments)
    Browser: {
      // In-app browser for payment gateways
    },

    // Storage
    Storage: {
      // For offline data
    },

    // Network
    Network: {
      // For offline detection
    },

    // Device
    Device: {
      // For analytics/debugging
    },
  },
};

export default config;
