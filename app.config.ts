import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key];
  if (typeof value === 'string' && value.length > 0) return value;
  return fallback;
};

const defaultRedirect = 'meuapp://auth/callback';

const config: ExpoConfig = {
  name: 'meuapp',
  slug: 'meuapp',
  scheme: 'meuapp',
  icon: './assets/images/icon.png',
  splash: {
    image: './assets/images/splash-logo.png',
    resizeMode: 'cover',
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
  },
  assetBundlePatterns: ['**/*'],
  plugins: ['expo-router'],
  extra: {
    router: {
      origin: false,
    },
    supabaseUrl: getEnv('EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnon: getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    authRedirectUri: getEnv('EXPO_PUBLIC_AUTH_REDIRECT_URI', defaultRedirect),
    googleClientId: getEnv('EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID'),
    googleClientSecret: getEnv('EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET'),
    googleAndroidClientId: getEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
    googleIosClientId: getEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  },
};

export default config;
