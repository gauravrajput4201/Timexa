import { RecordCard } from "@/components/history/RecordCard";
import { getBadgeMeta, matchesFilter } from "@/components/history/helpers";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTimeStore } from "@/stores/useTimeStore";
import { COLORS_LIGHT } from "@/theme/colors";
import { fetchAttendanceRecords } from "@/utils/attendanceApi";
import { CalendarDays, Clock3, RotateCw } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterKey = "all" | "completed" | "in-progress" | "incomplete";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Records" },
  { key: "completed", label: "Completed" },
  { key: "in-progress", label: "In Progress" },
  { key: "incomplete", label: "Missing Out" },
];

export default function HistoryScreen() {
  const { records, replaceRecords, setLoading, setError, isLoading, error } =
    useTimeStore();
  const { token } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const hasFetchedOnce = useRef(false);

  const sortedRecords = useMemo(
    () =>
      records
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [records],
  );

  const visibleRecords = useMemo(
    () => sortedRecords.filter((record) => matchesFilter(record, activeFilter)),
    [activeFilter, sortedRecords],
  );

  const fetchFromApi = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const apiRecords = await fetchAttendanceRecords(token);
      if (apiRecords.length > 0) {
        replaceRecords(apiRecords);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh attendance records.",
      );
    }
  }, [replaceRecords, setError, setLoading, token]);

  // Fetch once on fresh app launch (not on tab switches or re-renders).
  useEffect(() => {
    if (token && !hasFetchedOnce.current) {
      hasFetchedOnce.current = true;
      fetchFromApi();
    }
  }, [token, fetchFromApi]);

  // Refresh button: always calls API for fresh data.
  const handleRefresh = useCallback(() => {
    fetchFromApi();
  }, [fetchFromApi]);

  const totals = useMemo(() => {
    return sortedRecords.reduce(
      (acc, record) => ({
        days: acc.days + (record.checkOutTime ? 1 : 0),
        minutes: acc.minutes + (record.totalMinutes || 0),
      }),
      { days: 0, minutes: 0 },
    );
  }, [sortedRecords]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleRefresh}
            activeOpacity={0.8}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Refresh history"
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={COLORS_LIGHT.primaryForeground}
              />
            ) : (
              <RotateCw size={20} color={COLORS_LIGHT.primaryForeground} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon={<Clock3 size={24} color={COLORS_LIGHT.primary} />}
            iconStyle={styles.hoursIcon}
            value={`${Math.floor(totals.minutes / 60)}h`}
            label="Hours Worked"
          />
          <SummaryCard
            icon={<CalendarDays size={24} color={COLORS_LIGHT.success} />}
            iconStyle={styles.daysIcon}
            value={`${totals.days}`}
            label="Days Present"
          />
        </View>

        <ScrollView
          horizontal
          style={styles.filterScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                activeOpacity={0.82}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {visibleRecords.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <CalendarDays size={34} color={COLORS_LIGHT.textMuted} />
              <Text style={styles.emptyTitle}>No records yet</Text>
              <Text style={styles.emptyText}>
                Check in to start tracking your work hours.
              </Text>
            </View>
          ) : (
            visibleRecords.map((record) => (
              <RecordCard
                key={record.id || record.date}
                record={record}
                badge={getBadgeMeta(record)}
              />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  iconStyle,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconStyle: object;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, iconStyle]}>{icon}</View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS_LIGHT.textPrimary,
  },
  headerAction: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS_LIGHT.primary,
    borderWidth: 0,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    minHeight: 118,
    backgroundColor: COLORS_LIGHT.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.border,
    padding: 16,
    shadowColor: COLORS_LIGHT.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  hoursIcon: {
    backgroundColor: COLORS_LIGHT.primaryLight,
  },
  daysIcon: {
    backgroundColor: COLORS_LIGHT.successBackground,
  },
  summaryValue: {
    color: COLORS_LIGHT.textPrimary,
    fontSize: 28,
    fontWeight: "800",
  },
  summaryLabel: {
    color: COLORS_LIGHT.textSecondary,
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  filterRow: {
    gap: 10,
    paddingBottom: 16,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 54,
  },
  filterChip: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.border,
    backgroundColor: COLORS_LIGHT.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: COLORS_LIGHT.brandColor,
    borderColor: COLORS_LIGHT.brandColor,
  },
  filterText: {
    color: COLORS_LIGHT.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  filterTextActive: {
    color: COLORS_LIGHT.primaryForeground,
  },
  errorText: {
    color: COLORS_LIGHT.error,
    backgroundColor: COLORS_LIGHT.errorBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 54,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    color: COLORS_LIGHT.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    color: COLORS_LIGHT.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
