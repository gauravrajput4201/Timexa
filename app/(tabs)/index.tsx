import { useAuthStore } from "@/stores/useAuthStore";
import {
  calculateElapsedTime,
  formatTime,
  getStatus,
  useTimeStore,
} from "@/stores/useTimeStore";
import { COLORS_LIGHT } from "@/theme/colors";
import {
  checkInUser,
  checkOutUser,
  fetchAttendanceRecords,
} from "@/utils/attendanceApi";
import { Clock, LogIn, LogOut, Settings } from "lucide-react-native";
import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
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
  } = useTimeStore();
  const { token } = useAuthStore();

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

  // After hydration: load today from local storage, then background-sync with server
  useEffect(() => {
    if (hasHydrated) {
      loadTodayData();
      syncAttendance();
    }
  }, [hasHydrated, loadTodayData, syncAttendance]);

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

    // If a real token exists, try the API first
    if (token) {
      try {
        const record = await checkInUser(token);
        upsertRecord(record);
        return;
      } catch (err) {
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
    setLoading(false);
  };

  const submitCheckOut = async () => {
    setLoading(true);
    setError(null);

    if (token) {
      try {
        const record = await checkOutUser(token);
        upsertRecord(record);
        return;
      } catch (err) {
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

    // 2. If a real token exists, tell the backend the user is checking in again.
    //    We do NOT call upsertRecord with the API response because logToRecord
    //    already maps checkInTime to firstSession.checkIn, so the original entry
    //    time is preserved. Just fire-and-forget; ignore API errors silently
    //    because local state is already correct.
    if (token) {
      try {
        await checkInUser(token);
      } catch {
        // Non-fatal: local state already shows the correct "checked in" view
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
          <TouchableOpacity style={styles.settingsButton}>
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
