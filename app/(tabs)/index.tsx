import { useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  calculateElapsedTime,
  formatTime,
  getStatus,
  useTimeStore,
} from "@/stores/useTimeStore";
import { COLORS_LIGHT } from "@/theme/colors";
import { isNetworkError } from "@/utils/api";
import {
  checkInUser,
  checkOutUser,
  fetchAttendanceRecords,
} from "@/utils/attendanceApi";
import {
  cancelShiftEndNotification,
  requestNotificationPermission,
  scheduleShiftEndNotification,
} from "@/utils/notificationService";
import { router } from "expo-router";
import { Clock, LogIn, LogOut, Settings } from "lucide-react-native";
import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const {
    isCheckedIn,
    checkInTime,
    checkOutTime,
    isLoading,
    error,
    hasHydrated,
    loadTodayData,
    replaceRecords,
    upsertRecord,
    setLoading,
    setError,
    undoCheckout,
    checkIn,
    checkOut,
    markPendingSync,
  } = useTimeStore();
  const { token } = useAuthStore();
  const {
    workHoursMinutes,
    scheduledNotificationId,
    setScheduledNotificationId,
  } = useSettingsStore();

  // Get current date
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Silently sync attendance from server in the background.
  // Does nothing if there is no token (local/mock mode).
  const syncAttendance = useCallback(async () => {
    if (!token) return;
    try {
      const records = await fetchAttendanceRecords(token);
      replaceRecords(records);
    } catch {
      // Sync failure is non-fatal — local records remain visible
    }
  }, [replaceRecords, token]);

  // Push a locally-saved pending record to the server, then pull the latest.
  // Reads live store state so this callback is stable (doesn't depend on records).
  const syncPendingToday = useCallback(async () => {
    if (!token) return;
    const today = new Date().toISOString().split("T")[0];
    const { records } = useTimeStore.getState();
    const pending = records.find((r) => r.date === today && r.pendingSync);
    if (!pending) return;

    try {
      if (!pending.id) {
        // Check-in was offline — push it first
        const checked = await checkInUser(token);
        if (pending.checkOutTime) {
          // Persist server ID + local checkout before attempting checkout push.
          // If checkout fails, next retry sees pending.id and only retries checkout.
          upsertRecord({
            ...checked,
            checkOutTime: pending.checkOutTime,
            totalMinutes: pending.totalMinutes,
            pendingSync: true,
          });
          const finished = await checkOutUser(token);
          upsertRecord({ ...finished, pendingSync: false });
        } else {
          upsertRecord({ ...checked, pendingSync: false });
        }
      } else if (pending.checkOutTime) {
        // Check-in reached server; only checkout was offline
        const finished = await checkOutUser(token);
        upsertRecord({ ...finished, pendingSync: false });
      } else {
        // Undo checkout was done offline — push re-check-in (fire-and-forget)
        await checkInUser(token);
        upsertRecord({ ...pending, pendingSync: false });
      }
    } catch {
      // Still unreachable — pendingSync stays true for next retry
    }
  }, [token, upsertRecord]);

  // After hydration: load today, push any pending, then pull latest from server
  useEffect(() => {
    if (hasHydrated) {
      loadTodayData();
      syncPendingToday().then(() => syncAttendance());
    }
  }, [hasHydrated, loadTodayData, syncPendingToday, syncAttendance]);

  // Re-sync when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncPendingToday().then(() => syncAttendance());
      }
    });
    return () => sub.remove();
  }, [syncPendingToday, syncAttendance]);

  // Show loading spinner while hydrating
  if (!hasHydrated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.container, { justifyContent: "center" }]}>
          <ActivityIndicator size="large" color={COLORS_LIGHT.primary} />
          <Text style={{ marginTop: 16, color: COLORS_LIGHT.textSecondary }}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = getStatus(isCheckedIn, checkOutTime);

  // Calculate elapsed time on every render (no timer needed)
  const elapsedTime = calculateElapsedTime(
    checkInTime,
    checkOutTime,
    new Date(),
  );

  const submitCheckIn = async () => {
    setLoading(true);
    setError(null);

    if (token) {
      try {
        const record = await checkInUser(token);
        upsertRecord(record);
        await scheduleNotificationAfterCheckIn(record.checkInTime);
        return;
      } catch (err) {
        if (isNetworkError(err)) {
          checkIn();
          markPendingSync(new Date().toISOString().split("T")[0]);
          // Use the time the store just recorded, not a second new Date() call
          const { checkInTime: storedCheckIn } = useTimeStore.getState();
          await scheduleNotificationAfterCheckIn(
            storedCheckIn ?? new Date().toISOString(),
          );
          setLoading(false);
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Unable to check in. Please try again.",
        );
        return;
      }
    }

    // Offline / mock mode — record locally
    checkIn();
    // Use the time the store just recorded, not a second new Date() call
    const { checkInTime: storedCheckIn } = useTimeStore.getState();
    await scheduleNotificationAfterCheckIn(
      storedCheckIn ?? new Date().toISOString(),
    );
    setLoading(false);
  };

  /** Schedule a shift-end notification and persist its id. */
  const scheduleNotificationAfterCheckIn = async (checkInIso: string) => {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    const id = await scheduleShiftEndNotification(checkInIso, workHoursMinutes);
    setScheduledNotificationId(id);
  };

  const submitCheckOut = async () => {
    setLoading(true);
    setError(null);

    // Cancel the pending shift-end notification on checkout
    await cancelShiftEndNotification(scheduledNotificationId);
    setScheduledNotificationId(null);

    if (token) {
      try {
        const record = await checkOutUser(token);
        upsertRecord(record);
        return;
      } catch (err) {
        if (isNetworkError(err)) {
          checkOut();
          markPendingSync(new Date().toISOString().split("T")[0]);
          setLoading(false);
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Unable to check out. Please try again.",
        );
        return;
      }
    }

    // Offline / mock mode — record locally
    checkOut();
    setLoading(false);
  };

  const handleUndoCheckout = async () => {
    // 1. Restore local state immediately — entry time is preserved, isCheckedIn = true
    undoCheckout();

    // 2. Reschedule the shift-end notification from the original check-in time
    if (checkInTime) {
      await scheduleNotificationAfterCheckIn(checkInTime);
    }

    // 3. If a real token exists, tell the backend the user is checking in again.
    //    We do NOT call upsertRecord with the API response because logToRecord
    //    already maps checkInTime to firstSession.checkIn, so the original entry
    //    time is preserved. Just fire-and-forget; ignore API errors silently
    //    because local state is already correct.
    if (token) {
      try {
        await checkInUser(token);
      } catch (err) {
        if (isNetworkError(err)) {
          markPendingSync(new Date().toISOString().split("T")[0]);
        }
        // Non-fatal either way — local state already shows "checked in"
      }
    }
  };

  const handleButtonPress = async () => {
    if (checkOutTime) return;
    if (isCheckedIn) {
      await submitCheckOut();
    } else {
      await submitCheckIn();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerDate}>Today</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <Settings size={22} color={COLORS_LIGHT.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Date + Status */}
        <View style={styles.dateBlock}>
          <Text style={styles.day}>{dayName},</Text>
          <Text style={styles.date}>{monthDay}</Text>

          <View style={styles.statusPill}>
            <View
              style={[styles.statusDot, { backgroundColor: status.color }]}
            />
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
        </View>

        {/* Big Check In/Out Button */}
        <TouchableOpacity
          style={[
            styles.checkButton,
            checkOutTime && styles.checkButtonDisabled,
            isCheckedIn && !checkOutTime && styles.checkButtonOut,
          ]}
          activeOpacity={0.8}
          onPress={handleButtonPress}
          disabled={!!checkOutTime || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={COLORS_LIGHT.primaryForeground}
            />
          ) : (
            <>
              {isCheckedIn && !checkOutTime ? (
                <>
                  <LogOut size={40} color={COLORS_LIGHT.primaryForeground} />
                  <Text style={styles.checkLabel}>Check Out</Text>
                </>
              ) : (
                <>
                  <LogIn size={40} color={COLORS_LIGHT.primaryForeground} />
                  <Text style={styles.checkLabel}>
                    {checkOutTime ? "Completed" : "Check In"}
                  </Text>
                </>
              )}
            </>
          )}
        </TouchableOpacity>

        {checkOutTime && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={handleUndoCheckout}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Text style={styles.undoText}>Undo Checkout</Text>
          </TouchableOpacity>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Stats Card */}
        <View style={styles.statsCard}>
          {/* Entry */}
          <View style={styles.statsCol}>
            <Clock size={18} color={COLORS_LIGHT.textSecondary} />
            <Text style={styles.statsLabel}>ENTRY</Text>
            <Text style={styles.statsValue}>{formatTime(checkInTime)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Exit */}
          <View style={styles.statsCol}>
            <Clock size={18} color={COLORS_LIGHT.textSecondary} />
            <Text style={styles.statsLabel}>EXIT</Text>
            <Text style={styles.statsValue}>{formatTime(checkOutTime)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Total */}
          <View style={styles.statsCol}>
            <Clock size={18} color={COLORS_LIGHT.primary} />
            <Text style={[styles.statsLabel, { color: COLORS_LIGHT.primary }]}>
              TOTAL
            </Text>
            <Text style={styles.statsTotal}>{elapsedTime}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ======================= STYLES ========================= //

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS_LIGHT.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS_LIGHT.background,
    paddingTop: 24,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },

  // Header
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 32,
  },
  headerDate: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS_LIGHT.textPrimary,
    textAlign: "center",
  },
  settingsButton: {
    position: "absolute",
    right: 0,
    padding: 8,
  },

  // Date Section
  dateBlock: {
    alignItems: "center",
  },
  day: {
    fontSize: 48,
    fontWeight: "800",
    color: COLORS_LIGHT.textPrimary,
    lineHeight: 56,
    textAlign: "center",
  },

  date: {
    fontSize: 35,
    fontWeight: "800",
    color: COLORS_LIGHT.textPrimary,
    lineHeight: 48,
    textAlign: "center",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS_LIGHT.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.borderLight,
    alignSelf: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS_LIGHT.textMuted,
    marginRight: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "400",
    color: COLORS_LIGHT.textSecondary,
  },

  // Check In Button
  checkButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS_LIGHT.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    gap: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  checkButtonOut: {
    backgroundColor: COLORS_LIGHT.error,
  },
  checkButtonDisabled: {
    backgroundColor: COLORS_LIGHT.disabled,
    opacity: 0.6,
  },
  checkLabel: {
    color: COLORS_LIGHT.primaryForeground,
    fontSize: 17,
    fontWeight: "600",
  },

  undoButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    backgroundColor: COLORS_LIGHT.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.warning,
  },
  undoText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS_LIGHT.warning,
  },

  errorText: {
    alignSelf: "center",
    color: COLORS_LIGHT.error,
    backgroundColor: COLORS_LIGHT.errorBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: "center",
    fontSize: 14,
  },

  // Stats Card
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS_LIGHT.surface,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsCol: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  statsLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: "600",
    color: COLORS_LIGHT.textSecondary,
    textTransform: "uppercase",
  },
  statsValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS_LIGHT.textPrimary,
  },
  statsTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS_LIGHT.textPrimary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS_LIGHT.border,
  },
});
