import { useSettingsStore } from "@/stores/useSettingsStore";
import { COLORS_LIGHT } from "@/theme/colors";
import { requestNotificationPermission } from "@/utils/notificationService";
import { useFocusEffect } from "expo-router";
import { Bell } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function minutesToParts(totalMinutes: number): {
  hours: number;
  minutes: number;
} {
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export default function SettingsScreen() {
  const { workHoursMinutes, setWorkHours } = useSettingsStore();
  const initial = minutesToParts(workHoursMinutes);

  const [hours, setHours] = useState(String(initial.hours));
  const [mins, setMins] = useState(String(initial.minutes).padStart(2, "0"));
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const parts = minutesToParts(workHoursMinutes);
      setHours(String(parts.hours));
      setMins(String(parts.minutes).padStart(2, "0"));
    }, [workHoursMinutes]),
  );

  const handleSave = async () => {
    const h = parseInt(hours, 10);
    const m = parseInt(mins, 10);

    if (isNaN(h) || h < 0 || h > 23) {
      Alert.alert("Invalid Hours", "Hours must be between 0 and 23.");
      return;
    }
    if (isNaN(m) || m < 0 || m > 59) {
      Alert.alert("Invalid Minutes", "Minutes must be between 0 and 59.");
      return;
    }
    if (h === 0 && m === 0) {
      Alert.alert(
        "Invalid Duration",
        "Work duration must be at least 1 minute.",
      );
      return;
    }

    setWorkHours(h * 60 + m);
    await requestNotificationPermission();

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>Settings</Text>

          <View style={styles.section}>
            {/* Section title row */}
            <View style={styles.sectionHeader}>
              <View style={styles.iconBox}>
                <Bell size={20} color={COLORS_LIGHT.primary} />
              </View>
              <Text style={styles.sectionTitle}>Work Hours & Notification</Text>
            </View>

            <Text style={styles.sectionDesc}>
              Set your daily work duration. Once your shift hours are reached
              from the time you check in, you'll receive a reminder to mark your
              attendance.
            </Text>

            {/* Field label */}
            <Text style={styles.fieldLabel}>Work Duration</Text>

            {/* Hours : Minutes inline row */}
            <View style={styles.durationRow}>
              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={hours}
                    onChangeText={setHours}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="9"
                    placeholderTextColor={COLORS_LIGHT.inputPlaceholder}
                    selectTextOnFocus
                  />
                </View>
                <Text style={styles.unitLabel}>hrs</Text>
              </View>

              <Text style={styles.colon}>:</Text>

              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={mins}
                    onChangeText={setMins}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={COLORS_LIGHT.inputPlaceholder}
                    selectTextOnFocus
                  />
                </View>
                <Text style={styles.unitLabel}>min</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saved && styles.saveButtonSuccess]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {saved ? "Saved!" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS_LIGHT.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  // ── Header ── matches Profile screen
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS_LIGHT.textPrimary,
    marginBottom: 24,
    textAlign: "center",
  },

  // ── Section card ── matches Profile screen
  section: {
    backgroundColor: COLORS_LIGHT.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.borderLight,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS_LIGHT.primaryLight,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS_LIGHT.textPrimary,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS_LIGHT.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },

  // ── Field label ── matches Login screen label
  fieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS_LIGHT.textPrimary,
    marginBottom: 10,
  },

  // ── Duration row (hours : minutes side-by-side) ──
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // ── Input ── matches Login screen inputWrapper
  inputWrapper: {
    width: 72,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS_LIGHT.inputBorder,
    backgroundColor: COLORS_LIGHT.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS_LIGHT.textPrimary,
    textAlign: "center",
    width: "100%",
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS_LIGHT.textSecondary,
  },
  colon: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS_LIGHT.textPrimary,
    marginBottom: 2,
  },

  // ── Save button ── full-width, matches Login's AppButton height
  saveButton: {
    height: 52,
    backgroundColor: COLORS_LIGHT.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  saveButtonSuccess: {
    backgroundColor: COLORS_LIGHT.success,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS_LIGHT.primaryForeground,
  },
});
