import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key];
  if (typeof value === 'string' && value.length > 0) return value;
  return fallback;
};

const config: ExpoConfig = {
  name: 'meuapp',
  slug: 'meuapp',
  scheme: 'meuapp',
  icon: './assets/images/icon.png',
  splash: {
    image: './assets/images/splash-logo.png',
    resizeMode: 'contain',
    backgroundColor: '#59B3FF',
  },
  ios: {
    bundleIdentifier: 'com.meuapp.app',
  },
  android: {
    package: 'com.meuapp.app',
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#ffffff',
    },
  },
  web: {
    favicon: './assets/images/favicon.png',
    bundler: 'metro',
    publicPath: '/aprendermais/',
  },
  assetBundlePatterns: ['**/*'],
  plugins: ['expo-router'],
  extra: {
    router: {
      origin: false,
    },
    firebaseApiKey: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    firebaseAuthDomain: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    firebaseProjectId: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'aprendermais-e9e08'),
    firebaseStorageBucket: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    firebaseMessagingSenderId: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    firebaseAppId: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
    authRedirectUri: getEnv('EXPO_PUBLIC_AUTH_REDIRECT_URI'),
    googleClientId: getEnv('EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID'),
    googleClientSecret: getEnv('EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET'),
    googleAndroidClientId: getEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
    googleIosClientId: getEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  },
};

export default config;
