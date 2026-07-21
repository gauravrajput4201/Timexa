import { useAuthStore } from "@/stores/useAuthStore";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isLoggedIn, hasSeenWelcome, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Logged in - go to app
  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // First time user - show welcome
  if (!hasSeenWelcome) {
    return <Redirect href="/welcome" />;
  }

  // Not logged in - show login
  return <Redirect href="/login" />;
}
