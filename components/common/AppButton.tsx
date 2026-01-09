import { COLORS_LIGHT } from "@/theme/colors";
import React from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

type AppButtonProps = TouchableOpacityProps & {
  title: string;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
};

const AppButton = ({
  title,
  containerStyle,
  textStyle,
  activeOpacity = 0.9,
  ...rest
}: AppButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      style={[styles.button, containerStyle]}
      {...rest}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default AppButton;

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS_LIGHT.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS_LIGHT.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS_LIGHT.primaryForeground,
  },
});
