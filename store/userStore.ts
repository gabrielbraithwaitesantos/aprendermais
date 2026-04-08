import { create } from 'zustand';
import { User } from '../types/database';
import { getUserProfile, updateUserProfile } from '../lib/firebaseData';

interface UserState {
  profile: User | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  loading: false,

  fetchProfile: async (userId: string) => {
    set({ loading: true });
    try {
      const profile = await getUserProfile(userId);
      set({ profile, loading: false });
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ loading: false });
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const { profile } = get();
    if (!profile) return;

    try {
      const updated = await updateUserProfile(profile.id, updates);
      if (updated) {
        set({ profile: updated });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  },

  clearProfile: () => {
    set({ profile: null });
  },
}));