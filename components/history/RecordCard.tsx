import { formatTime, TimeRecord, TimeSession } from "@/stores/useTimeStore";
import { COLORS_LIGHT } from "@/theme/colors";
import { CalendarDays, LogIn, LogOut } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    BadgeStyle,
    formatDate,
    formatDuration,
    getBadgeStyle,
    getParentCardTotal,
    getWeekLabel,
} from "./helpers";

interface RecordCardProps {
  record: TimeRecord;
  badge: { label: string; style: BadgeStyle };
}

export function RecordCard({ record, badge }: RecordCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sessions = record.sessions?.length
    ? record.sessions
    : fallbackSessions(record);
  const firstSession = sessions[0];
  const lastSession = sessions[sessions.length - 1];

  return (
    <TouchableOpacity
      style={styles.recordCard}
      activeOpacity={0.88}
      onPress={() => setIsOpen((prev) => !prev)}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordDateGroup}>
          <View style={styles.recordIcon}>
            <CalendarDays size={22} color={COLORS_LIGHT.primary} />
          </View>
          <View>
            <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
            <Text style={styles.recordSubtext}>
              {getWeekLabel(record.date)}
            </Text>
          </View>
        </View>

        <Text style={[styles.statusPill, getBadgeStyle(badge.style)]}>
          {badge.label}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.recordBody}>
        <View style={styles.timeColumn}>
          <TimeLine
            icon={<LogIn size={20} color="#9AA9BF" />}
            value={formatTime(firstSession.checkIn)}
          />
          <TimeLine
            icon={<LogOut size={20} color="#9AA9BF" />}
            value={formatTime(lastSession.checkOut)}
          />
        </View>

        <View style={styles.totalColumn}>
          <Text style={styles.totalEyebrow}>TOTAL</Text>
          <Text style={styles.totalValue}>{getParentCardTotal(record)}</Text>
        </View>
      </View>

      {isOpen && (
        <View style={styles.detailPanel}>
          <Text style={styles.detailTitle}>All Entries</Text>
          {sessions.map((session, index) => (
            <SessionDetail
              key={`${record.id || record.date}-${index}`}
              index={index}
              session={session}
            />
          ))}
          <View style={styles.detailTotal}>
            <Text style={styles.detailTotalValue}>
              {formatDuration(record.entryExitTotalMinutes)}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function TimeLine({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View style={styles.timeLine}>
      {icon}
      <Text style={styles.timeValue}>{value}</Text>
    </View>
  );
}

function SessionDetail({
  index,
  session,
}: {
  index: number;
  session: TimeSession;
}) {
  return (
    <View style={styles.sessionDetail}>
      <Text style={styles.sessionNumber}>Session {index + 1}</Text>
      <View style={styles.sessionTimes}>
        <Text style={styles.sessionText}>In {formatTime(session.checkIn)}</Text>
        <Text style={styles.sessionText}>
          Out {formatTime(session.checkOut)}
        </Text>
        <Text style={styles.sessionDuration}>
          {formatDuration(session.sessionMinutes)}
        </Text>
      </View>
    </View>
  );
}

function fallbackSessions(record: TimeRecord): TimeSession[] {
  return [
    {
      checkIn: record.checkInTime,
      checkOut: record.checkOutTime || null,
      sessionMinutes: record.totalMinutes || 0,
    },
  ];
}

const styles = StyleSheet.create({
  recordCard: {
    backgroundColor: COLORS_LIGHT.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS_LIGHT.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  recordDateGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F7FF",
  },
  recordDate: {
    color: COLORS_LIGHT.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  recordSubtext: {
    color: COLORS_LIGHT.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS_LIGHT.border,
    marginTop: 14,
    marginBottom: 12,
  },
  recordBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },
  timeColumn: {
    flex: 1,
    gap: 10,
  },
  timeLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeValue: {
    color: COLORS_LIGHT.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  totalColumn: {
    alignItems: "flex-end",
    gap: 5,
    minWidth: 88,
  },
  totalEyebrow: {
    color: COLORS_LIGHT.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  totalValue: {
    color: COLORS_LIGHT.primary,
    fontSize: 22,
    fontWeight: "800",
  },
  detailPanel: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS_LIGHT.border,
    gap: 10,
  },
  detailTitle: {
    color: COLORS_LIGHT.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  sessionDetail: {
    backgroundColor: COLORS_LIGHT.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS_LIGHT.borderLight,
    padding: 12,
    gap: 8,
  },
  sessionNumber: {
    color: COLORS_LIGHT.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
  sessionTimes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sessionText: {
    color: COLORS_LIGHT.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  sessionDuration: {
    color: COLORS_LIGHT.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  detailTotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 4,
  },
  detailTotalValue: {
    color: COLORS_LIGHT.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
});
