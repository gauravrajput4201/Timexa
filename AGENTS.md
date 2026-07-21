# AI Instructions for Timexa

Use this file as the first source of context before making any change in this repository.

## App Context

Timexa is an Expo / React Native time-tracking app.

- Framework: Expo with `expo-router`
- Language: TypeScript
- UI: React Native `StyleSheet`
- State: Zustand
- Persistence: `@react-native-async-storage/async-storage`
- Forms: React Hook Form + Zod
- Icons: `lucide-react-native`
- Main theme: `theme/colors.ts`

The app currently supports:

- Welcome screen shown once
- Local/mock login
- Signup form validation
- Tab navigation with Home, History, and Profile
- Daily check-in/check-out
- Persisted local time records
- Undo checkout for the current day
- Monthly cleanup of old records

## Important Files

- `app/_layout.tsx`: root stack layout
- `app/index.tsx`: first route; redirects based on welcome/auth state
- `app/welcome.tsx`: first-time welcome screen
- `app/login.tsx`: login form and mock login flow
- `app/signup.tsx`: signup form
- `app/(tabs)/_layout.tsx`: bottom tab configuration
- `app/(tabs)/index.tsx`: main check-in/check-out screen
- `app/(tabs)/history.tsx`: saved time records list
- `app/(tabs)/profile.tsx`: profile and logout
- `stores/useAuthStore.ts`: auth and welcome state
- `stores/useTimeStore.ts`: time tracking state and helpers
- `components/common/AppButton.tsx`: shared primary button
- `theme/colors.ts`: active color palette
- `constants/theme.ts`: mostly Expo starter theme code; avoid using for new app UI unless intentionally refactoring

## Current Behavior Notes

- Auth is local/mock. `login(email, password)` accepts any non-empty valid form values and stores a `Guest` user.
- Signup currently validates input and navigates to tabs, but does not persist a new user in `useAuthStore`.
- Time records are persisted in AsyncStorage under `time-storage`.
- Auth state is persisted in AsyncStorage under `auth-storage`.
- The Home screen waits for Zustand hydration before reading today data.
- The elapsed time display is calculated from the current render time. If a live ticking timer is needed, add an interval carefully and clean it up on unmount.
- `stores/README.md` may be stale because it describes in-memory time storage, while the implementation uses AsyncStorage persistence.

## Rules Before Making Changes

1. Read the relevant existing files before editing.
2. Preserve the current Expo Router file-based routing structure.
3. Prefer existing app patterns over introducing new libraries or architecture.
4. Use `COLORS_LIGHT` from `theme/colors.ts` for new screen styling unless doing a broader theme refactor.
5. Use the shared `AppButton` for primary full-width actions when it fits.
6. Keep Zustand stores focused:
   - `useAuthStore` owns login/logout/welcome/user state.
   - `useTimeStore` owns check-in/check-out/history state.
7. Do not remove or rewrite user work unless explicitly asked.
8. Avoid broad refactors for small feature requests.
9. Keep TypeScript strict and avoid `any` unless there is a strong reason.
10. Do not add backend assumptions. The app is currently local-first/mock-auth.

## Change Guidelines

- For auth changes, update `stores/useAuthStore.ts` first, then wire screens to it.
- For time-tracking changes, update `stores/useTimeStore.ts` first, then update Home/History UI.
- For UI changes, keep spacing, border radius, colors, and typography consistent with existing screens.
- For navigation changes, use `expo-router` APIs such as `Redirect`, `router.push`, and `router.replace`.
- For persistent state changes, consider migration/backward compatibility with existing AsyncStorage data.
- For validation changes, keep schemas near the forms that use them unless validation becomes shared.

## Verification Checklist

After changes, run the most relevant checks:

- `npm run lint`
- `npx tsc --noEmit` if TypeScript behavior changed
- `npm start` / `npm run ios` / `npm run android` when UI or navigation changed

Manually verify these flows when affected:

- First launch redirects to Welcome
- Welcome button sends user to Login
- Login persists user and opens tabs
- Signup behavior matches the intended auth flow
- Check In creates today's record
- Check Out completes today's record
- Undo Checkout reopens today's record
- History shows saved records
- Logout returns to Login

## Product Direction

Treat Timexa as a simple, focused work-hours tracker. Prioritize reliability, clarity, and low-friction daily use over complex dashboards or heavy configuration.
