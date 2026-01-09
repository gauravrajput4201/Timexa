# Time Tracking Store

Production-ready Zustand store for managing time tracking state with **in-memory storage**.

## Features

- ✅ **Centralized State Management** - All time tracking state in one place
- ✅ **In-Memory Storage** - Fast, temporary storage (ready for API integration)
- ✅ **Monthly Cleanup** - Removes last month's data on the 5th of each month
- ✅ **Type Safety** - Full TypeScript support with interfaces
- ✅ **No File System** - Simplified architecture, API-ready
- ✅ **Synchronous Operations** - No async overhead
- ✅ **Day-by-Day Tracking** - Stores records by date (YYYY-MM-DD)
- ✅ **Utility Functions** - Reusable formatters and calculators

## Store Structure

```typescript
interface TimeState {
  // State
  records: TimeRecord[]; // In-memory (current month only)
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  currentTime: Date;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentTime: (time: Date) => void;
  loadTodayData: () => void;
  checkIn: () => void;
  checkOut: () => void;
  reset: () => void;
  cleanOldRecords: () => void; // Removes last month on 5th
  getAllRecords: () => TimeRecord[]; // For API sync
  clearAllRecords: () => void;
}
```

## Usage

```tsx
import { useTimeStore } from "@/stores/useTimeStore";

const {
  isCheckedIn,
  checkInTime,
  checkOutTime,
  currentTime,
  checkIn,
  checkOut,
  loadTodayData,
  cleanOldRecords,
} = useTimeStore();

// Load data and clean old records on mount
useEffect(() => {
  loadTodayData();
  cleanOldRecords();
}, []);

// Check in (synchronous)
checkIn();

// Check out (synchronous)
checkOut();
```

## Utility Functions

### `formatTime(isoString: string | null): string`

Formats ISO string to "HH:MM AM/PM" format.

```tsx
formatTime("2026-01-09T10:30:00.000Z"); // "10:30 AM"
formatTime(null); // "--:--"
```

### `calculateElapsedTime(checkInTime, checkOutTime, currentTime): string`

Calculates elapsed time between check-in and check-out (or current time).

```tsx
// During work: "2h 30m 45s"
// After checkout: "8h 15m"
```

### `getStatus(isCheckedIn, checkOutTime): { text, color }`

Returns current status and color for UI display.

```tsx
// Not checked in: { text: "Not Logged In", color: "#9CA3AF" }
// Checked in: { text: "Logged In", color: "#4CAF50" }
// Checked out: { text: "Logged Out", color: "#9CA3AF" }
```

## Data Structure

Records are stored **in-memory only** (current month):

```json
[
  {
    "date": "2026-01-09",
    "checkInTime": "2026-01-09T09:00:00.000Z",
    "checkOutTime": "2026-01-09T17:30:00.000Z",
    "totalMinutes": 510
  }
]
```

### Auto-Cleanup (Monthly)

- **Before 5th of month**: Keeps current month + previous month
- **On 5th of month**: Removes all previous month data, keeps only current month
- Cleanup runs on app startup via `cleanOldRecords()`
- Call manually anytime: `useTimeStore.getState().cleanOldRecords()`

**Example:**
- January 1-4: Shows December + January data
- January 5+: Shows only January data (December removed)
- February 5+: Shows only February data (January removed)

## API Integration Ready

### Export Records for API Sync

```tsx
// Get all records (for syncing to backend)
const records = useTimeStore.getState().getAllRecords();

// Send to API
await fetch('/api/sync', {
  method: 'POST',
  body: JSON.stringify({ records }),
});

// Clear local records after successful sync
useTimeStore.getState().clearAllRecords();
```

## Production Features

1. **In-Memory Only** - No file system dependencies
2. **Synchronous Operations** - Instant UI updates
3. **Monthly Cleanup** - Removes last month on 5th of each month
4. **API Ready** - Easy to sync with backend
5. **Clean Architecture** - Separation of concerns
6. **Memory Efficient** - Auto-removes old data monthly
7. **TypeScript** - Full type safety

## Future API Integration

When ready to integrate with your backend:

1. Replace `checkIn()` with API call
2. Replace `checkOut()` with API call
3. Use `getAllRecords()` to sync pending records
4. Use `clearAllRecords()` after successful sync
5. Keep in-memory cache for offline support

## Migration Path

```tsx
// Current (in-memory)
checkIn();

// Future (with API)
const syncCheckIn = async () => {
  checkIn(); // Update UI immediately
  await api.checkIn(); // Sync to backend
};
```

## Future Enhancements

- [ ] Export to CSV/PDF
- [ ] Weekly/Monthly summaries
- [ ] Offline-first sync
- [ ] Push notifications for reminders
- [] Analytics and insights
