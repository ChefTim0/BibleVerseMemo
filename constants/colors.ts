export const lightColors = {
  background: "#F9FAFB",
  cardBackground: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#E5E7EB",
  primary: "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#06B6D4",
  purple: "#8B5CF6",
};

export const darkColors = {
  background: "#111827",
  cardBackground: "#1F2937",
  text: "#F9FAFB",
  textSecondary: "#D1D5DB",
  textTertiary: "#9CA3AF",
  border: "#374151",
  primary: "#6366F1",
  success: "#34D399",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#22D3EE",
  purple: "#A78BFA",
};

export type ColorScheme = typeof lightColors;

export function getColors(theme: 'light' | 'dark'): ColorScheme {
  return theme === 'dark' ? darkColors : lightColors;
}
