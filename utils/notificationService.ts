import { Platform } from "react-native";

/**
 * expo-notifications accesses native bridge code at module load time.
 * In Expo Go the native module is absent, so we load it via require()
 * inside a try-catch. In a dev-client / production build it loads normally.
 * All exported functions silently no-op when the module is unavailable.
 */
type ExpoNotifications = typeof import("expo-notifications");

// eslint-disable-next-line @typescript-eslint/no-require-imports
let N: ExpoNotifications | null = (() => {
  try {
    const mod = require("expo-notifications") as ExpoNotifications;
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return mod;
  } catch {
    // Running in Expo Go — notifications require a dev-client build.
    return null;
  }
})();

/**
 * Requests notification permissions from the OS.
 * On Android 13+ this is required at runtime.
 *
 * @returns true if permission was granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!N) return false;

  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync("shift-end", {
      name: "Shift End Reminder",
      importance: N.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1D5ED5",
    });
  }

  const { status: existingStatus } = await N.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await N.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Schedules a local notification to fire when the shift ends.
 *
 * Calculates: notificationTime = checkInTime + workHoursMinutes
 * If that time is already in the past (e.g. user worked overtime and then
 * opened the app), returns null — no stale notification is scheduled.
 *
 * @param checkInTime  ISO string of when the user checked in today.
 * @param workMinutes  Required shift length in minutes (e.g. 540 for 9h).
 * @returns The notification identifier, or null if scheduling was skipped.
 */
export async function scheduleShiftEndNotification(
  checkInTime: string,
  workMinutes: number,
): Promise<string | null> {
  if (!N) return null;

  const fireDate = new Date(
    new Date(checkInTime).getTime() + workMinutes * 60 * 1000,
  );

  // Do not schedule a notification that would fire in the past
  if (fireDate <= new Date()) return null;

  const hours = Math.floor(workMinutes / 60);
  const mins = workMinutes % 60;
  const durationLabel = mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;

  const id = await N.scheduleNotificationAsync({
    content: {
      title: "Shift Complete — Mark Your Attendance",
      body: `You've completed your ${durationLabel} shift. Don't forget to check out.`,
      sound: "default",
      data: { type: "shift-end" },
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  });

  return id;
}

/**
 * Cancels a previously scheduled shift-end notification.
 * Safe to call with a null/undefined id — it will simply return.
 *
 * @param notificationId  The id returned by scheduleShiftEndNotification.
 */
export async function cancelShiftEndNotification(
  notificationId: string | null | undefined,
): Promise<void> {
  if (!N || !notificationId) return;
  await N.cancelScheduledNotificationAsync(notificationId);
}
