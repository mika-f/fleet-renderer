/** Fleet canvases are always rendered/edited at a fixed 9:16 portrait aspect ratio. */
export const FLEET_ASPECT_RATIO = 9 / 16;

/** Reference output resolution used by the server-side renderer (also a good default preview canvas size). */
export const FLEET_CANVAS_WIDTH = 1080;
export const FLEET_CANVAS_HEIGHT = 1920;

/** Scale bounds for text and sticker layers, matching the server-enforced schema. */
export const FLEET_TEXT_STICKER_SCALE_MIN = 0.1;
export const FLEET_TEXT_STICKER_SCALE_MAX = 5.0;

/** Scale bounds for the media (background) layer — allowed to zoom out further to support crop/pan editing. */
export const FLEET_MEDIA_SCALE_MIN = 0.05;
export const FLEET_MEDIA_SCALE_MAX = 5.0;

/** Rotation range exposed by the compose UI (the server schema itself allows -360..360). */
export const FLEET_ROTATION_UI_MIN = -180;
export const FLEET_ROTATION_UI_MAX = 180;

/** Server-enforced maximums (`FLEET_SCHEMA` in teyvat's `foreign-model`). */
export const FLEET_MAX_TEXTS = 10;
export const FLEET_MAX_STICKERS = 20;
export const FLEET_TEXT_MAX_LENGTH = 500;

export const FLEET_DEFAULT_BACKGROUND_COLORS: readonly string[] = [
  "#000000",
  "#1a1a2e",
  "#0d3b66",
  "#1b4332",
  "#7b2d8b",
  "#c0392b",
  "#e67e22",
  "#ffffff",
];

export const FLEET_DEFAULT_PLACEMENT = {
  posX: 0.5,
  posY: 0.5,
  scale: 1,
  rotation: 0,
} as const;

/** Minimum on-screen sizes (px) so text/stickers stay legible on small containers. Set to `0` to disable. */
export const FLEET_DEFAULT_MIN_FONT_SIZE_PX = 14;
export const FLEET_DEFAULT_MIN_STICKER_SIZE_PX = 28;

/** Fixed floors (px) for a text layer's background "pill" padding/corner radius. */
export const FLEET_TEXT_PADDING_VERTICAL_PX = 8;
export const FLEET_TEXT_PADDING_HORIZONTAL_PX = 12;
export const FLEET_TEXT_BORDER_RADIUS_PX = 10;
