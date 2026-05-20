import { AttendanceStatus, TimeRecord } from "@/stores/useTimeStore";
import { apiRequest } from "./api";

type AttendanceSession = {
  checkIn: string;
  checkOut: string | null;
  sessionMinutes: number;
};

type AttendanceLog = {
  id: string;
  userId: string;
  date: string;
  sessions: AttendanceSession[];
  attendanceStatus?: AttendanceStatus;
  totalMinutes: number;
  entryExitTotalMinutes: number;
};

type AttendanceResponse = {
  attendanceLog: AttendanceLog;
};

type AttendanceLogsResponse = {
  attendanceLogs: AttendanceLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

const getLogDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const logToRecord = (log: AttendanceLog): TimeRecord | null => {
  const firstSession = log.sessions[0];
  const lastSession = log.sessions[log.sessions.length - 1];

  return {
    id: log.id,
    date: getLogDate(log.date),
    // Keep records even when there are no sessions (absent/holiday days).
    checkInTime: firstSession?.checkIn || "",
    checkOutTime: lastSession?.checkOut || undefined,
    attendanceStatus: log.attendanceStatus,
    totalMinutes: log.totalMinutes,
    entryExitTotalMinutes: log.entryExitTotalMinutes,
    sessions: log.sessions || [],
  };
};

function requireRecord(log?: AttendanceLog) {
  const record = log ? logToRecord(log) : null;
  if (!record) {
    throw new Error("Attendance response is missing attendance details.");
  }
  return record;
}

export async function fetchAttendanceRecords(token: string) {
  const allLogs: AttendanceLog[] = [];
  let page = 1;
  let hasNextPage = true;
  const MAX_PAGES = 10;

  while (hasNextPage && page <= MAX_PAGES) {
    const response = await apiRequest<AttendanceLogsResponse>(
      `/attendance/logs?page=${page}&limit=100&sortBy=date&sortOrder=desc`,
      { token },
    );

    const logs = response.data?.attendanceLogs || [];
    allLogs.push(...logs);

    hasNextPage = Boolean(response.data?.pagination.hasNextPage);
    page += 1;
  }

  return allLogs
    .map(logToRecord)
    .filter((record): record is TimeRecord => Boolean(record));
}

export async function checkInUser(token: string) {
  const response = await apiRequest<AttendanceResponse>(
    "/attendance/check-in",
    {
      method: "POST",
      token,
    },
  );

  return requireRecord(response.data?.attendanceLog);
}

export async function checkOutUser(token: string) {
  const response = await apiRequest<AttendanceResponse>(
    "/attendance/check-out",
    {
      method: "POST",
      token,
    },
  );

  return requireRecord(response.data?.attendanceLog);
}
