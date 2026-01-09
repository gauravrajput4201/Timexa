import AppButton from "@/components/common/AppButton";
import { useAuthStore } from "@/stores/useAuthStore";
import { COLORS_LIGHT } from "@/theme/colors";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";



 const WelcomeScreen = () => {
  const router = useRouter();
  const { setWelcomeSeen } = useAuthStore();

  const handleGetStarted = () => {
    setWelcomeSeen(); // Mark welcome as seen
    router.push("/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Center Content */}
        <View style={styles.content}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("@/assets/images/brandLogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Brand */}
          <Text style={styles.brand}>TIMEXA</Text>
          
          <Text style={styles.slogan}>Time, done right.</Text>

          {/* Description */}
          <Text style={styles.description}>
            Track work hours accurately.{"\n"}
            No guesswork. No confusion.
          </Text>
        </View>

        {/* CTA */}
        <AppButton
          title="Get Started"
          onPress={handleGetStarted}
        />
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS_LIGHT.background,
  },

  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 48,
    paddingHorizontal: 24,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  brand: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS_LIGHT.brandColor,
    letterSpacing: 3,
    marginTop: 24,
    textAlign: "center",
  },

  slogan: {
    fontSize: 17,
    fontWeight: "500",
    color: COLORS_LIGHT.textSecondary,
    letterSpacing: 0.3,
    marginTop: 8,
    marginBottom: 32,
    textAlign: "center",
  },

  description: {
    fontSize: 16,
    fontWeight: "400",
    color: COLORS_LIGHT.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },

  logoWrapper: {
    borderRadius: 100,
    backgroundColor: COLORS_LIGHT.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // elevation: 4,
    width: 180,
    height: 180,
  },

  logo: {
    width: 180,
    height: 180,
  },

});
  