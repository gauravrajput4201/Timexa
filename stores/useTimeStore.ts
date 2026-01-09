import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface TimeRecord {
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  totalMinutes?: number;
}

interface TimeState {
  // State
  records: TimeRecord[]; // Persistent storage (current month only)
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTodayData: () => void;
  checkIn: () => void;
  checkOut: () => void;
  undoCheckout: () => void; // Undo accidental checkout (same day only)
  reset: () => void;
  cleanOldRecords: () => void; // Removes last month's data on 5th of month
  getAllRecords: () => TimeRecord[]; // For API sync
  clearAllRecords: () => void; // For testing/reset
}

const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
};

// Clean records from previous months (keep only current month)
// This runs on the 5th of each month to remove last month's data
const filterCurrentMonthRecords = (records: TimeRecord[]): TimeRecord[] => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();

  // If it's the 5th or later, keep only current month
  if (today.getDate() >= 5) {
    return records.filter((record) => {
      const recordDate = new Date(record.date);
      return (
        recordDate.getMonth() === currentMonth &&
        recordDate.getFullYear() === currentYear
      );
    });
  }

  // Before 5th, keep current month and previous month
  return records.filter((record) => {
    const recordDate = new Date(record.date);
    const recordMonth = recordDate.getMonth();
    const recordYear = recordDate.getFullYear();

    // Keep current month
    if (recordMonth === currentMonth && recordYear === currentYear) {
      return true;
    }

    // Keep previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    if (recordMonth === prevMonth && recordYear === prevYear) {
      return true;
    }

    return false;
  });
};

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      // Initial state
      records: [],
      isCheckedIn: false,
      checkInTime: null,
      checkOutTime: null,
      isLoading: false,
      error: null,

      // Load today's data from persistent records
      loadTodayData: () => {
        const { records } = get();
        const todayDate = getTodayDate();
        const todayRecord = records.find((r) => r.date === todayDate);

        if (todayRecord) {
          set({
            checkInTime: todayRecord.checkInTime,
            checkOutTime: todayRecord.checkOutTime || null,
            isCheckedIn: !!todayRecord.checkInTime,
          });
        }
      },

      // Check in
      checkIn: () => {
        const { records } = get();
        const now = new Date().toISOString();
        const todayDate = getTodayDate();

        // Update state immediately
        set({
          checkInTime: now,
          isCheckedIn: true,
          checkOutTime: null,
        });

        // Update records
        const filteredRecords = records.filter((r) => r.date !== todayDate);
        const updatedRecords = [
          ...filteredRecords,
          {
            date: todayDate,
            checkInTime: now,
          },
        ];

        set({ records: filterCurrentMonthRecords(updatedRecords) });
      },

      // Check out
      checkOut: () => {
        const { checkInTime, records } = get();
        if (!checkInTime) {
          set({ error: "No check-in time found" });
          return;
        }

        const now = new Date().toISOString();
        const todayDate = getTodayDate();

        // Calculate total minutes
        const checkInDate = new Date(checkInTime);
        const checkOutDate = new Date(now);
        const totalMinutes = Math.floor(
          (checkOutDate.getTime() - checkInDate.getTime()) / 1000 / 60
        );

        // Update state
        set({ checkOutTime: now });

        // Update records
        const updatedRecords = records.map((r) =>
          r.date === todayDate ? { ...r, checkOutTime: now, totalMinutes } : r
        );

        set({ records: updatedRecords });
      },

      // Undo checkout (only works for today's checkout)
      undoCheckout: () => {
        const { records, checkInTime } = get();
        const todayDate = getTodayDate();
        const todayRecord = records.find((r) => r.date === todayDate);

        // Only allow undo if there's a checkout time for today
        if (!todayRecord?.checkOutTime) {
          set({ error: "No checkout to undo" });
          return;
        }

        // Remove checkout time and total minutes
        set({ 
          checkOutTime: null,
          isCheckedIn: true 
        });

        // Update records
        const updatedRecords = records.map((r) =>
          r.date === todayDate
            ? { date: r.date, checkInTime: r.checkInTime }
            : r
        );

        set({ records: updatedRecords });
      },

      // Clean old records (remove last month's data on 5th of current month)
      cleanOldRecords: () => {
        const { records } = get();
        set({ records: filterCurrentMonthRecords(records) });
      },

      // Get all records (for API sync in future)
      getAllRecords: () => {
        return get().records;
      },

      // Clear all records (for testing/reset)
      clearAllRecords: () => {
        set({ records: [] });
      },

      // Reset state (for testing or day change)
      reset: () =>
        set({
          isCheckedIn: false,
          checkInTime: null,
          checkOutTime: null,
          error: null,
        }),
    }),
    {
      name: "time-storage", // Key in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        records: state.records,
        isCheckedIn: state.isCheckedIn,
        checkInTime: state.checkInTime,
        checkOutTime: state.checkOutTime,
      }),
    }
  )
);

// Utility functions for formatting
export const formatTime = (isoString: string | null): string => {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const calculateElapsedTime = (
  checkInTime: string | null,
  checkOutTime: string | null,
  currentTime: Date
): string => {
  if (!checkInTime) return "0h 00m 00s";

  const start = new Date(checkInTime);
  const end = checkOutTime ? new Date(checkOutTime) : currentTime;
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const seconds = Math.floor((diffMs / 1000) % 60);

  // Always show seconds (even after checkout)
  return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
};

export const getStatus = (
  isCheckedIn: boolean,
  checkOutTime: string | null
): { text: string; color: string } => {
  if (checkOutTime)
    return { text: "Logged Out", color: "#9CA3AF" }; // COLORS_LIGHT.textMuted
  if (isCheckedIn) return { text: "Logged In", color: "#4CAF50" }; // COLORS_LIGHT.success
  return { text: "Not Logged In", color: "#9CA3AF" }; // COLORS_LIGHT.textMuted
};
