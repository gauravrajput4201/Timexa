import { useAuthStore } from "@/stores/useAuthStore";
import { useTimeStore } from "@/stores/useTimeStore";
import { COLORS_LIGHT } from "@/theme/colors";
import { useRouter } from "expo-router";
import { BadgeCheck, IdCard, LogOut, Mail, Shield, User } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { clearAllRecords } = useTimeStore();
  const router = useRouter();
  const initials = user?.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  const handleLogout = () => {
    logout();
    clearAllRecords();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Profile</Text>

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.identityText}>
            <Text style={styles.name}>{user?.name || "Timexa User"}</Text>
            <View style={styles.rolePill}>
              <BadgeCheck size={15} color={COLORS_LIGHT.primary} />
              <Text style={styles.roleText}>{user?.role || "user"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>

          <InfoRow
            icon={<Mail size={20} color={COLORS_LIGHT.primary} />}
            label="Email"
            value={user?.email || "Not available"}
          />
          <InfoRow
            icon={<User size={20} color={COLORS_LIGHT.primary} />}
            label="Full Name"
            value={user?.name || "Not available"}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <InfoRow
            icon={<Shield size={20} color={COLORS_LIGHT.primary} />}
            label="Role"
            value={user?.role || "user"}
          />
          <InfoRow
            icon={<IdCard size={20} color={COLORS_LIGHT.primary} />}
            label="User ID"
            value={user?.id || "Not available"}
            compact
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={COLORS_LIGHT.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, compact && styles.compactValue]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS_LIGHT.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS_LIGHT.textPrimary,
    marginBottom: 24,
    textAlign: "center",
  },
  identityCard: {
    backgroundColor: COLORS_LIGHT.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.borderLight,
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS_LIGHT.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.focusRing,
  },
  avatarText: {
    color: COLORS_LIGHT.primary,
    fontSize: 30,
    fontWeight: "800",
  },
  identityText: {
    alignItems: "center",
    gap: 10,
  },
  name: {
    color: COLORS_LIGHT.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS_LIGHT.highlight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  roleText: {
    color: COLORS_LIGHT.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  section: {
    backgroundColor: COLORS_LIGHT.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.borderLight,
    marginBottom: 14,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS_LIGHT.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS_LIGHT.primaryLight,
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
  compactValue: {
    fontSize: 13,
    lineHeight: 18,
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
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.error,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS_LIGHT.error,
  },
});
