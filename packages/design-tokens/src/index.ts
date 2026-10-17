/** Shared visual tokens; consumers map these to platform-specific styles. */
export const colors = {
  primary: "#135448",
  primaryDark: "#0B3833",
  secondary: "#D7A65B",
  background: "#F5F7F4",
  surface: "#FFFFFF",
  text: "#18312E",
  muted: "#62736E",
  border: "#E1E8E3",
  success: "#267D5C",
  warning: "#A56A1C",
  error: "#B83B3B",
  info: "#326A9B",
} as const;
export const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;
export const typeScale = { caption: 12, small: 14, body: 16, subheading: 19, heading: 25, display: 30 } as const;
export const layout = { minimumTapTarget: 44, maximumContentWidth: 1120 } as const;
