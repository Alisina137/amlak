/** Shared visual language across AmlakLink mobile and staff surfaces.
 * Deep jade anchors navigation and trust; warm sand/gold add restrained emphasis.
 * Keep semantic status colors for safety and accessibility.
 */
export const colors = {
  primary: "#105747",
  primaryDark: "#073C33",
  primarySoft: "#E5F3EC",
  primaryWash: "#F0F8F3",
  secondary: "#C79854",
  accent: "#A77935",
  accentSoft: "#FBF2E3",
  background: "#F4F6F3",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceMuted: "#F8FAF8",
  text: "#172F2A",
  textSecondary: "#425C51",
  muted: "#64766F",
  border: "#E0E9E2",
  borderStrong: "#C7D8CD",
  divider: "#EDF1ED",
  success: "#227650",
  warning: "#986318",
  error: "#B63737",
  info: "#28688C",
} as const;
export const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 10, md: 14, lg: 20, xl: 24, pill: 999 } as const;
export const typeScale = { caption: 12, small: 14, body: 16, subheading: 19, heading: 25, display: 30 } as const;
export const layout = { minimumTapTarget: 44, maximumContentWidth: 1120 } as const;
/** Designed for white cards on our neutral canvas; low elevation on budget Android. */
export const elevation = {
  card: { shadowColor: "#102C25",shadowOffset: {width: 0,height: 5},shadowOpacity: 0.055,shadowRadius: 16,elevation: 2 },
  floating: { shadowColor: "#102C25",shadowOffset: {width: 0,height: 10},shadowOpacity: 0.10,shadowRadius: 24,elevation: 5 },
} as const;
