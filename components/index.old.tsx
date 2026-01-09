

import { COLORS_LIGHT } from "@/theme/colors";
import * as FileSystem from "expo-file-system";
import { Clock, LogIn, LogOut, Settings } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TimeRecord {
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  totalMinutes?: number;
}

const STORAGE_FILE = `timeRecords.json`;

// Storage helper functions
const saveRecords = async (records: TimeRecord[]) => {
  try {
    await FileSystem.writeAsStringAsync(STORAGE_FILE, JSON.stringify(records));
  } catch (error) {
    console.error("Error saving records:", error);
  }
};

const loadRecords = async (): Promise<TimeRecord[]> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(STORAGE_FILE);
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error loading records:", error);
  }
  return [];
};

export default function HomeScreen() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get current date
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const todayDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // Load today's data on mount
  useEffect(() => {
    loadTodayData();
  }, []);

  // Update current time every second when checked in
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isCheckedIn && !checkOutTime) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn, checkOutTime]);

  const loadTodayData = async () => {
    try {
      const records = await loadRecords();
      const todayRecord = records.find((r) => r.date === todayDate);

      if (todayRecord) {
        setCheckInTime(todayRecord.checkInTime);
        setCheckOutTime(todayRecord.checkOutTime || null);
        setIsCheckedIn(!!todayRecord.checkInTime);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleCheckIn = async () => {
    try {
      const now = new Date().toISOString();
      setCheckInTime(now);
      setIsCheckedIn(true);
      setCheckOutTime(null);

      // Save to storage
      const records = await loadRecords();

      // Remove any existing record for today
      const filteredRecords = records.filter((r) => r.date !== todayDate);

      // Add new record
      filteredRecords.push({
        date: todayDate,
        checkInTime: now,
      });

      await saveRecords(filteredRecords);
    } catch (error) {
      console.error("Error checking in:", error);
    }
  };

  const handleCheckOut = async () => {
    try {
      const now = new Date().toISOString();
      setCheckOutTime(now);

      if (!checkInTime) return;

      // Calculate total minutes
      const checkInDate = new Date(checkInTime);
      const checkOutDate = new Date(now);
      const totalMinutes = Math.floor(
        (checkOutDate.getTime() - checkInDate.getTime()) / 1000 / 60
      );

      // Update storage
      const records = await loadRecords();

      const updatedRecords = records.map((r) =>
        r.date === todayDate
          ? { ...r, checkOutTime: now, totalMinutes }
          : r
      );

      await saveRecords(updatedRecords);
    } catch (error) {
      console.error("Error checking out:", error);
    }
  };

  // Format time as HH:MM AM/PM
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "--:--";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Calculate elapsed time
  const calculateElapsedTime = () => {
    if (!checkInTime) return "0h 00m";

    const start = new Date(checkInTime);
    const end = checkOutTime ? new Date(checkOutTime) : currentTime;
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / 1000 / 60);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    const seconds = Math.floor((diffMs / 1000) % 60);

    if (checkOutTime) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
    }
    return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  };

  // Determine status
  const getStatus = () => {
    if (checkOutTime) return { text: "Logged Out", color: COLORS_LIGHT.textMuted };
    if (isCheckedIn) return { text: "Logged In", color: COLORS_LIGHT.success };
    return { text: "Not Logged In", color: COLORS_LIGHT.textMuted };
  };

  const status = getStatus();

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
          onPress={
            checkOutTime
              ? undefined
              : isCheckedIn
              ? handleCheckOut
              : handleCheckIn
          }
          disabled={!!checkOutTime}
        >
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
        </TouchableOpacity>

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
            <Text style={styles.statsTotal}>{calculateElapsedTime()}</Text>
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
    // marginBottom: 1,
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
    // marginTop: ,
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
