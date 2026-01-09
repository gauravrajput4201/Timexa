import { useAuthStore } from "@/stores/useAuthStore";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isLoggedIn, hasSeenWelcome, checkAuthStatus } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkAuthStatus();
      setIsReady(true);
    };
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // First time user - show welcome
  if (!hasSeenWelcome) {
    return <Redirect href="/welcome" />;
  }

  // Logged in - go to app
  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // Not logged in - show login
  return <Redirect href="/login" />;
}
