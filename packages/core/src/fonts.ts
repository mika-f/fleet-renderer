import type { FleetTextStyle } from "./types";

export interface FleetFontDescriptor {
  style: FleetTextStyle;
  weight: 400 | 700;
  /** React Native `fontFamily` value (installed font name). */
  reactNativeFontFamily: string;
  /** CSS `font-family` value for web. */
  cssFontFamily: string;
  /** Font name to register/reference when rendering via satori. */
  satoriFontName: string;
}

/**
 * Canonical font mapping for the three shipped Fleet text styles' font. Unifies three previously
 * divergent naming schemes (RN font family strings, Tailwind font classes, satori-registered names).
 * `serif` intentionally maps to the same font as `default` until a dedicated serif asset exists.
 */
export const FLEET_FONTS: Record<FleetTextStyle, FleetFontDescriptor> = {
  default: {
    style: "default",
    weight: 400,
    reactNativeFontFamily: "Noto Sans JP Regular",
    cssFontFamily: "Noto Sans JP",
    satoriFontName: "Noto Sans JP",
  },
  bold: {
    style: "bold",
    weight: 700,
    reactNativeFontFamily: "Noto Sans JP Bold",
    cssFontFamily: "Noto Sans JP",
    satoriFontName: "Noto Sans JP",
  },
  serif: {
    style: "serif",
    weight: 400,
    reactNativeFontFamily: "Noto Sans JP Regular",
    cssFontFamily: "Noto Sans JP",
    satoriFontName: "Noto Sans JP",
  },
  handwriting: {
    style: "handwriting",
    weight: 400,
    reactNativeFontFamily: "HunyaJi-Re",
    cssFontFamily: "HunyaJi-Re",
    satoriFontName: "HunyaJi-Re",
  },
};

export const getFleetFontDescriptor = (style: FleetTextStyle): FleetFontDescriptor => FLEET_FONTS[style];
