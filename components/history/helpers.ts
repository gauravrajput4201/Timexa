import { AttendanceStatus, TimeRecord } from "@/stores/useTimeStore";
import { StyleSheet } from "react-native";

export type BadgeStyle =
  | "present"
  | "absent"
  | "inProgress"
  | "halfDay"
  | "holiday";

export function getBadgeMeta(record: TimeRecord): {
  label: string;
  style: BadgeStyle;
} {
  if (record.attendanceStatus) {
    const styleMap: Record<string, BadgeStyle> = {
      [AttendanceStatus.present]: "present",
      [AttendanceStatus.absent]: "absent",
      [AttendanceStatus.inProgress]: "inProgress",
      [AttendanceStatus.halfDay]: "halfDay",
      [AttendanceStatus.holiday]: "holiday",
    };
    return {
      label: record.attendanceStatus,
      style: styleMap[record.attendanceStatus] || "inProgress",
    };
  }

  // No status from backend — show neutral "in-progress" for local-only records.
  return { label: "inProgress", style: "inProgress" };
}

const badgeStyles = StyleSheet.create({
  present: { backgroundColor: "#DAF8E2", color: "#0B873C" },
  absent: { backgroundColor: "#FFE1E1", color: "#C51F1F" },
  inProgress: { backgroundColor: "#FFF4D6", color: "#B88C00" },
  halfDay: { backgroundColor: "#FFF4D6", color: "#B88C00" },
  holiday: { backgroundColor: "#E8F1FF", color: "#1D5ED5" },
});

export function getBadgeStyle(style: BadgeStyle) {
  return badgeStyles[style] || badgeStyles.absent;
}

export function matchesFilter(record: TimeRecord, activeFilter: string) {
  if (activeFilter === "all") return true;

  if (activeFilter === "completed") {
    return (
      record.attendanceStatus === AttendanceStatus.present ||
      record.attendanceStatus === AttendanceStatus.halfDay ||
      Boolean(record.checkOutTime)
    );
  }

  if (activeFilter === "in-progress") {
    if (record.attendanceStatus === AttendanceStatus.inProgress) return true;
    if (record.attendanceStatus) return false;
    return Boolean(record.checkInTime && !record.checkOutTime);
  }

  if (activeFilter === "incomplete") {
    return (
      record.attendanceStatus === AttendanceStatus.absent ||
      Boolean(!record.checkInTime && !record.checkOutTime)
    );
  }

  return true;
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function getWeekLabel(dateString: string) {
  const date = new Date(dateString);
  const start = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  return `Week ${Math.ceil((dayOfYear + start.getDay() + 1) / 7)}`;
}

export function formatDuration(minutes?: number) {
  if (minutes === undefined || minutes === null) return "0h 00m";
  if (minutes <= 0) return "0h 00m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
}

export function getParentCardTotal(record: TimeRecord) {
  if (typeof record.totalMinutes === "number") {
    return formatDuration(record.totalMinutes);
  }

  if (record.checkInTime && !record.checkOutTime) {
    const startMs = new Date(record.checkInTime).getTime();
    if (!Number.isNaN(startMs)) {
      const diffMs = Math.max(0, Date.now() - startMs);
      const minutes = Math.floor(diffMs / (1000 * 60));
      return formatDuration(minutes);
    }
  }

  return "0h 00m";
}
