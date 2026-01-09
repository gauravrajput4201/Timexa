import React, { useState } from "react";
import {
  Image,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";


import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid work email"),

  password: z.string().min(4, "Password must be at least 4 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    const success = await login(data.email, data.password);
    if (success) {
      router.replace("/(tabs)");
    }
  };


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
            <View style={[styles.header,  styles.headerCompact]}>
             
                <View style={styles.logoWrapper}>
                  <Image
                    source={require("@/assets/images/brandLogo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              

              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Log in to track your work hours.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email */}
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[styles.inputWrapper, errors.email && styles.inputError]}
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
                      placeholder="Enter your password"
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
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </TouchableOpacity>

              <AppButton
                title="Log In"
                containerStyle={styles.button}
                onPress={handleSubmit(onSubmit)}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => router.push("/signup")}
                >
                  <Text style={styles.signupLink}>Sign Up</Text>
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

  headerCompact: {
    marginBottom: 16,
  },

  logoWrapper: {
    borderRadius: 100,
    backgroundColor: COLORS_LIGHT.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginBottom: 24,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // elevation: 3,
    width: 150,
    height: 150,
  },

  logo: {
    width: 160,
    height: 160,
  },

  brand: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS_LIGHT.textSecondary,
    marginBottom: 24,
  },

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

  /* ---------- Actions ---------- */

  button: {
    marginTop: 24,
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS_LIGHT.primaryForeground,
  },

  forgot: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS_LIGHT.primary,
    textAlign: "right",
    marginTop: 12,
    marginBottom: 8,
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

  signupLink: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS_LIGHT.primary,
  },
});

export default LoginScreen;
