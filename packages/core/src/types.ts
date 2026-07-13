/**
 * A Fleet text layer's visual style. `serif` currently has no dedicated font asset upstream and
 * falls back to the same font as `default` — kept as a distinct value since the data model (and
 * the eventual dedicated font) already exists.
 */
export type FleetTextStyle = "default" | "bold" | "serif" | "handwriting";

export type FleetTextAlignment = "left" | "center" | "right";

/**
 * Normalized position/transform shared by every layer kind (media, text, sticker).
 * `posX`/`posY` are fractional coordinates where `0.5` is the container center; a layer's own
 * center is placed at that fraction, then scaled and rotated about its own center.
 *
 * Unlike text/sticker layers (which are expected to stay within `[0, 1]`), media placement is
 * intentionally allowed to range outside `[0, 1]` to support pannable/zoomable background crop.
 */
export interface FleetPlacement {
  posX: number;
  posY: number;
  scale: number;
  rotation: number;
}

export interface FleetMediaEntity {
  url: string;
  alt?: string;
  /** Intrinsic width/height, used to preserve aspect ratio. Falls back to the container's own aspect ratio when absent. */
  width?: number;
  height?: number;
  placement?: FleetPlacement;
}

export interface FleetTextEntity extends FleetPlacement {
  id?: string;
  body: string;
  textStyle: FleetTextStyle;
  textAlignment: FleetTextAlignment;
  color: string;
  /** Hex color or `"transparent"`. */
  backgroundColor?: string;
}

export interface FleetStickerEntity extends FleetPlacement {
  id?: string;
  /** Unicode emoji codepoints, or a reaction "symbol" resolved to an image via `resolveStickerImageUrl`. */
  emoji: string;
  /** Pre-resolved image URL, when the consumer already knows it. */
  imageUrl?: string;
}

/** The platform-agnostic "Fleet document" — everything needed to lay out and render a single Fleet. */
export interface FleetContentData {
  backgroundColor: string;
  media: FleetMediaEntity | null;
  texts: FleetTextEntity[];
  stickers: FleetStickerEntity[];
}

export interface ContainerSize {
  width: number;
  height: number;
}
