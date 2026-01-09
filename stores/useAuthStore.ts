import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserData {
  name: string;
  email: string;
}

interface AuthState {
  // State
  isLoggedIn: boolean;
  user: UserData | null;
  hasSeenWelcome: boolean; // Track if user has seen welcome screen

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setWelcomeSeen: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isLoggedIn: false,
      user: null,
      hasSeenWelcome: false,

      // Login function
      login: async (email: string, password: string) => {
        try {
          // For now, just store the credentials (replace with API call later)
          // You can add validation here
          if (email && password) {
            set({
              isLoggedIn: true,
              user: {
                name: "Guest", // Static name as requested
                email: email,
              },
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Login error:", error);
          return false;
        }
      },

      // Logout function
      logout: () => {
        set({
          isLoggedIn: false,
          user: null,
        });
      },

      // Mark welcome screen as seen
      setWelcomeSeen: () => {
        set({ hasSeenWelcome: true });
      },

      // Check auth status (called on app start)
      checkAuthStatus: async () => {
        // This will automatically load from AsyncStorage via persist middleware
        const { isLoggedIn } = get();
        return;
      },
    }),
    {
      name: "auth-storage", // Key in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
