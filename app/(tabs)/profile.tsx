import { useAuthStore } from "@/stores/useAuthStore";
import { COLORS_LIGHT } from "@/theme/colors";
import { useRouter } from "expo-router";
import { LogOut, Mail, User } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.header}>Profile</Text>

        {/* User Info Card */}
        <View style={styles.card}>
          {/* Avatar Circle */}
          <View style={styles.avatar}>
            <User size={40} color={COLORS_LIGHT.primary} />
          </View>

          {/* Name */}
          <View style={styles.infoRow}>
            <User size={20} color={COLORS_LIGHT.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>Guest</Text>
            </View>
          </View>

          {/* Email */}
          <View style={styles.infoRow}>
            <Mail size={20} color={COLORS_LIGHT.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email || "Not available"}</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={COLORS_LIGHT.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS_LIGHT.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS_LIGHT.textPrimary,
    marginBottom: 32,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS_LIGHT.surface,
    borderRadius: 12,
    padding: 24,
    gap: 24,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.borderLight,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS_LIGHT.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS_LIGHT.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS_LIGHT.textPrimary,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: COLORS_LIGHT.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 32,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.error,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS_LIGHT.error,
  },
});
