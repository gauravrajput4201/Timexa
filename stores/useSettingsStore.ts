import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Default shift duration: 9 hours = 540 minutes
const DEFAULT_WORK_MINUTES = 9 * 60;

interface SettingsState {
  /** Total required work duration in minutes. Default: 540 (9h 0m). */
  workHoursMinutes: number;

  /**
   * The expo-notifications identifier for the currently scheduled
   * shift-end notification. Null when no notification is pending.
   */
  scheduledNotificationId: string | null;

  setWorkHours: (totalMinutes: number) => void;
  setScheduledNotificationId: (id: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      workHoursMinutes: DEFAULT_WORK_MINUTES,
      scheduledNotificationId: null,

      setWorkHours: (totalMinutes) => set({ workHoursMinutes: totalMinutes }),

      setScheduledNotificationId: (id) => set({ scheduledNotificationId: id }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
