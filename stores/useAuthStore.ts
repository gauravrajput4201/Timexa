import { UserData } from "@/utils/authApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  // State
  isLoggedIn: boolean;
  user: UserData | null;
  token: string | null;
  hasSeenWelcome: boolean; // Track if user has seen welcome screen
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => void; // Local/mock login (offline-first)
  setSession: (user: UserData, token: string) => void; // API login result
  setAuthLoading: (isLoading: boolean) => void;
  setAuthError: (message: string | null) => void;
  logout: () => void;
  setWelcomeSeen: () => void;
  checkAuthStatus: () => void;
  clearError: () => void;
  setHasHydrated: (state: boolean) => void;
  finishHydration: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isLoggedIn: false,
      user: null,
      token: null,
      hasSeenWelcome: false,
      hasHydrated: false,
      isLoading: false,
      error: null,

      // Local mock login — accepts any valid credentials, stores a Guest user
      login: (email: string, _password: string) => {
        const guestUser: UserData = {
          id: "guest",
          name: "Guest",
          email,
          role: "user",
        };
        set({
          isLoggedIn: true,
          user: guestUser,
          token: null,
          isLoading: false,
          error: null,
        });
      },

      setSession: (user: UserData, token: string) => {
        set({ isLoggedIn: true, user, token, isLoading: false, error: null });
      },

      setAuthLoading: (isLoading: boolean) => set({ isLoading }),

      setAuthError: (message: string | null) =>
        set({ error: message, isLoading: false }),

      // Logout function
      logout: () => {
        set({
          isLoggedIn: false,
          user: null,
          token: null,
          error: null,
        });
      },

      // Mark welcome screen as seen
      setWelcomeSeen: () => {
        set({ hasSeenWelcome: true });
      },

      // Check auth status (called on app start)
      checkAuthStatus: () => {
        const { token } = get();
        set({ isLoggedIn: !!token });
      },

      clearError: () => set({ error: null }),

      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),

      finishHydration: () => {
        const { token } = get();
        set({
          hasHydrated: true,
          isLoggedIn: !!token,
        });
      },
    }),
    {
      name: "auth-storage", // Key in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        hasSeenWelcome: state.hasSeenWelcome,
      }),
      onRehydrateStorage: () => (state) => {
        state?.finishHydration();
      },
    },
  ),
);
