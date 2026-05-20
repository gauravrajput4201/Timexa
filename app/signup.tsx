import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import AppButton from "@/components/common/AppButton";
import { useAuthStore } from "@/stores/useAuthStore";
import { COLORS_LIGHT } from "@/theme/colors";
import { createUser, loginUser } from "@/utils/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect, useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid work email"),

    password: z.string().min(6, "Password must be at least 6 characters"),
    // .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    // .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    // .regex(/[0-9]/, "Password must contain at least one number"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const SignupScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const {
    setSession,
    login,
    setAuthLoading,
    setAuthError,
    isLoading,
    error,
    clearError,
    hasHydrated,
    token,
  } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: SignupFormValues) => {
    clearError();
    setAuthLoading(true);
    try {
      await createUser(data.name, data.email, data.password);
      const session = await loginUser(data.email, data.password);
      setSession(session.user, session.token);
      router.replace("/(tabs)");
    } catch (err) {
      // If server is unreachable, fall back to local mock mode
      const isNetworkError =
        err instanceof Error &&
        (err.message.toLowerCase().includes("network") ||
          err.message.toLowerCase().includes("connect") ||
          err.message.toLowerCase().includes("timexa server"));

      if (isNetworkError) {
        login(data.email, data.password);
        router.replace("/(tabs)");
        return;
      }

      setAuthError(
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.",
      );
    }
  };

  if (!hasHydrated) {
    return (
      <View style={[styles.safe, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS_LIGHT.primary} />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              {/* <View style={styles.logoWrapper}>
                <Image
                  source={require("@/assets/images/brandLogo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View> */}

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Sign up to start tracking your work hours.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name */}
              <Text style={styles.label}>Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.name && styles.inputError,
                    ]}
                  >
                    <User
                      size={20}
                      color={COLORS_LIGHT.textMuted}
                      style={styles.iconLeft}
                    />

                    <TextInput
                      placeholder="Enter your full name"
                      placeholderTextColor={COLORS_LIGHT.inputPlaceholder}
                      style={styles.input}
                      autoCapitalize="words"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  </View>
                )}
              />

              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}

              {/* Email */}
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.email && styles.inputError,
                    ]}
                  >
                    <Mail
                      size={20}
                      color={COLORS_LIGHT.textMuted}
                      style={styles.iconLeft}
                    />

                    <TextInput
                      placeholder="name@work-email.com"
                      placeholderTextColor={COLORS_LIGHT.inputPlaceholder}
                      style={styles.input}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  </View>
                )}
              />

              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}

              {/* Password */}
              <Text style={styles.label}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.password && styles.inputError,
                    ]}
                  >
                    <Lock
                      size={20}
                      color={COLORS_LIGHT.textMuted}
                      style={styles.iconLeft}
                    />

                    <TextInput
                      placeholder="Create a strong password"
                      placeholderTextColor={COLORS_LIGHT.inputPlaceholder}
                      style={styles.input}
                      secureTextEntry={!showPassword}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />

                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={COLORS_LIGHT.textMuted} />
                      ) : (
                        <Eye size={20} color={COLORS_LIGHT.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}

              {/* Confirm Password */}
              <Text style={styles.label}>Confirm Password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.confirmPassword && styles.inputError,
                    ]}
                  >
                    <Lock
                      size={20}
                      color={COLORS_LIGHT.textMuted}
                      style={styles.iconLeft}
                    />

                    <TextInput
                      placeholder="Re-enter your password"
                      placeholderTextColor={COLORS_LIGHT.inputPlaceholder}
                      style={styles.input}
                      secureTextEntry={!showConfirmPassword}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />

                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color={COLORS_LIGHT.textMuted} />
                      ) : (
                        <Eye size={20} color={COLORS_LIGHT.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>
                  {errors.confirmPassword.message}
                </Text>
              )}

              {error && <Text style={styles.serverError}>{error}</Text>}

              <AppButton
                title={isLoading ? "Creating Account..." : "Sign Up"}
                containerStyle={styles.button}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS_LIGHT.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },

  container: {
    paddingHorizontal: 24,
  },

  /* ---------- Header ---------- */

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  //   logoWrapper: {
  //     borderRadius: 100,
  //     backgroundColor: COLORS_LIGHT.surface,
  //     alignItems: "center",
  //     justifyContent: "center",
  //     padding: 16,
  //     marginBottom: 24,
  //     shadowColor: "#000",
  //     shadowOffset: { width: 0, height: 2 },
  //     shadowOpacity: 0.1,
  //     shadowRadius: 8,
  //     elevation: 3,
  //   },

  //   logo: {
  //     width: 64,
  //     height: 64,
  //   },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS_LIGHT.textPrimary,
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: COLORS_LIGHT.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  /* ---------- Form ---------- */

  form: {
    marginTop: 8,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS_LIGHT.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS_LIGHT.inputBorder,
    backgroundColor: COLORS_LIGHT.inputBackground,
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  inputError: {
    borderColor: COLORS_LIGHT.error,
  },

  iconLeft: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS_LIGHT.textPrimary,
    paddingVertical: 0,
  },

  errorText: {
    fontSize: 13,
    color: COLORS_LIGHT.error,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },

  serverError: {
    fontSize: 14,
    color: COLORS_LIGHT.error,
    backgroundColor: COLORS_LIGHT.errorBackground,
    borderWidth: 1,
    borderColor: "#F8B9BC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },

  /* ---------- Actions ---------- */

  button: {
    marginTop: 24,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },

  footerText: {
    fontSize: 15,
    color: COLORS_LIGHT.textSecondary,
  },

  loginLink: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS_LIGHT.primary,
  },
});

export default SignupScreen;
