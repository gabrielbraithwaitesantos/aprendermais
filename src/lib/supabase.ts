import 'expo-standard-web-crypto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

type ExtraConfig = {
  supabaseUrl?: string;
  supabaseAnon?: string;
};

const extra = (Constants.expoConfig?.extra ??
  // @ts-expect-error manifestExtra exists at runtime for legacy compat
  Constants.manifestExtra ??
  {}) as ExtraConfig;

const fromProcessEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  // web builds sometimes expose env via globalThis
  if (typeof globalThis !== 'undefined' && (globalThis as any)[key]) {
    return String((globalThis as any)[key]);
  }
  return undefined;
};

const supabaseUrl = extra.supabaseUrl ?? fromProcessEnv('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnon = extra.supabaseAnon ?? fromProcessEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Supabase credentials are missing. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
