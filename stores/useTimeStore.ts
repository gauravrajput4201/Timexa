import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export enum AttendanceStatus {
  present = "present",
  absent = "absent",
  inProgress = "inProgress",
  halfDay = "half-day",
  holiday = "holiday",
}

export interface TimeRecord {
  id?: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  attendanceStatus?: AttendanceStatus;
  totalMinutes?: number;
  entryExitTotalMinutes?: number;
  sessions?: TimeSession[];
}

export interface TimeSession {
  checkIn: string;
  checkOut: string | null;
  sessionMinutes: number;
}

interface TimeState {
  // State
  records: TimeRecord[];
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean; // Track if persisted state has loaded

  // Actions
  checkIn: () => void; // Local check-in (offline-first)
  checkOut: () => void; // Local check-out (offline-first)
  loadTodayData: () => void;
  replaceRecords: (records: TimeRecord[]) => void;
  upsertRecord: (record: TimeRecord) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (message: string | null) => void;
  allowAnotherCheckIn: () => void;
  undoCheckout: () => void; // Backward-compatible alias for allowAnotherCheckIn
  reset: () => void;
  cleanOldRecords: () => void; // Legacy local cleanup; do not use for backend history
  getAllRecords: () => TimeRecord[]; // For API sync
  clearAllRecords: () => void; // For testing/reset
  setHasHydrated: (state: boolean) => void;
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
      hasHydrated: false,

      // Set hydration state
      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state });
      },

      // Local offline check-in — creates a fresh record for today
      checkIn: () => {
        const now = new Date();
        const todayDate = getTodayDate();
        const checkInTime = now.toISOString();
        const newRecord: TimeRecord = { date: todayDate, checkInTime };
        const { records } = get();
        const filtered = records.filter((r) => r.date !== todayDate);
        set({
          records: [newRecord, ...filtered],
          isCheckedIn: true,
          checkInTime,
          checkOutTime: null,
          error: null,
        });
      },

      // Local offline check-out — closes today's record
      checkOut: () => {
        const { records, checkInTime } = get();
        const todayDate = getTodayDate();
        const todayRecord = records.find((r) => r.date === todayDate);
        if (!todayRecord) return;
        const now = new Date();
        const checkOutTime = now.toISOString();
        const checkInMs = checkInTime
          ? new Date(checkInTime).getTime()
          : now.getTime();
        const totalMinutes = Math.round((now.getTime() - checkInMs) / 60000);
        const updatedRecord: TimeRecord = {
          ...todayRecord,
          checkOutTime,
          totalMinutes,
        };
        const updatedRecords = records.map((r) =>
          r.date === todayDate ? updatedRecord : r,
        );
        set({
          records: updatedRecords,
          isCheckedIn: false,
          checkOutTime,
          error: null,
        });
      },

      // Load today's data from persistent records
      loadTodayData: () => {
        const { records } = get();
        const todayDate = getTodayDate();
        const todayRecord = records.find((r) => r.date === todayDate);

        if (todayRecord) {
          set({
            checkInTime: todayRecord.checkInTime,
            checkOutTime: todayRecord.checkOutTime || null,
            isCheckedIn: !!todayRecord.checkInTime && !todayRecord.checkOutTime,
          });
        } else {
          // No record for today - reset to fresh state
          // Previous day's records remain in storage but UI starts fresh
          set({
            checkInTime: null,
            checkOutTime: null,
            isCheckedIn: false,
          });
        }
      },

      replaceRecords: (records: TimeRecord[]) => {
        set({ records, isLoading: false, error: null });
        get().loadTodayData();
      },

      upsertRecord: (record: TimeRecord) => {
        const records = get().records.filter((r) => r.date !== record.date);
        set({
          records: [record, ...records],
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime || null,
          isCheckedIn: !!record.checkInTime && !record.checkOutTime,
          isLoading: false,
          error: null,
        });
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (message: string | null) =>
        set({ error: message, isLoading: false }),

      allowAnotherCheckIn: () => {
        const { records } = get();
        const todayDate = getTodayDate();
        const todayRecord = records.find((r) => r.date === todayDate);

        if (!todayRecord?.checkOutTime) {
          set({ error: "No completed checkout found for today" });
          return;
        }

        // Keep the original entry time — only clear the checkout.
        // isCheckedIn = true so the button shows "Check Out" right away.
        const updatedRecord: TimeRecord = {
          ...todayRecord,
          checkOutTime: undefined,
          totalMinutes: undefined,
        };
        const updatedRecords = records.map((r) =>
          r.date === todayDate ? updatedRecord : r,
        );
        set({
          records: updatedRecords,
          checkInTime: todayRecord.checkInTime, // original entry time preserved
          checkOutTime: null,
          isCheckedIn: true,
          error: null,
        });
      },

      undoCheckout: () => {
        get().allowAnotherCheckIn();
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
        set({
          records: [],
          checkInTime: null,
          checkOutTime: null,
          isCheckedIn: false,
        });
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
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
  currentTime: Date,
): string => {
  if (!checkInTime) return "0h 00m 00s";

  const start = new Date(checkInTime);
  const end = checkOutTime ? new Date(checkOutTime) : currentTime;
  const startTime = start.getTime();
  const endTime = end.getTime();

  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    return "0h 00m 00s";
  }

  const diffMs = Math.max(0, endTime - startTime);
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const seconds = Math.floor((diffMs / 1000) % 60);

  // Always show seconds (even after checkout)
  return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
};

export const getStatus = (
  isCheckedIn: boolean,
  checkOutTime: string | null,
): { text: string; color: string } => {
  if (checkOutTime) return { text: "Logged Out", color: "#9CA3AF" }; // COLORS_LIGHT.textMuted
  if (isCheckedIn) return { text: "Logged In", color: "#4CAF50" }; // COLORS_LIGHT.success
  return { text: "Not Logged In", color: "#9CA3AF" }; // COLORS_LIGHT.textMuted
};
