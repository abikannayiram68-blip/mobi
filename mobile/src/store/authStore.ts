import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const API_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'https://comparative-filters-hopes-gtk.trycloudflare.com';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: async (user) => {
    await AsyncStorage.setItem('custom_auth_session', JSON.stringify(user));
    set({ user });
  },
  logout: async () => {
    await AsyncStorage.removeItem('custom_auth_session');
    set({ user: null });
  },
  checkSession: async () => {
    try {
      const stored = await AsyncStorage.getItem('custom_auth_session');
      if (stored) {
        set({ user: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load session', e);
    } finally {
      set({ isLoading: false });
    }
  }
}));
