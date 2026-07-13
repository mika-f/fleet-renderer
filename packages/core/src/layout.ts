import {
  FLEET_DEFAULT_MIN_FONT_SIZE_PX,
  FLEET_DEFAULT_MIN_STICKER_SIZE_PX,
  FLEET_DEFAULT_PLACEMENT,
  FLEET_TEXT_BORDER_RADIUS_PX,
  FLEET_TEXT_PADDING_HORIZONTAL_PX,
  FLEET_TEXT_PADDING_VERTICAL_PX,
} from "./constants";
import { type ContainerUnits, createContainerUnits } from "./container-units";
import { FLEET_FONTS, type FleetFontDescriptor } from "./fonts";
import { type PixelTransform, placementToPixelTransform } from "./placement";
import type {
  ContainerSize,
  FleetContentData,
  FleetMediaEntity,
  FleetStickerEntity,
  FleetTextAlignment,
  FleetTextEntity,
} from "./types";

export interface ResolveFleetLayoutOptions {
  /** Minimum text font size in px (floor). Set to `0` to disable. */
  minFontSizePx?: number;
  /** Minimum sticker size in px (floor). Set to `0` to disable. */
  minStickerSizePx?: number;
}

export interface ResolvedFleetMediaLayer {
  type: "media";
  transform: PixelTransform;
  widthPx: number;
  heightPx: number;
  url: string;
  alt?: string;
}

export interface ResolvedFleetTextLayer {
  type: "text";
  key: string;
  transform: PixelTransform;
  body: string;
  textAlignment: FleetTextAlignment;
  color: string;
  backgroundColor: string;
  font: FleetFontDescriptor;
  fontSizePx: number;
  lineHeightPx: number;
  paddingVerticalPx: number;
  paddingHorizontalPx: number;
  borderRadiusPx: number;
  maxWidthPx: number;
}

export interface ResolvedFleetStickerLayer {
  type: "sticker";
  key: string;
  transform: PixelTransform;
  emoji: string;
  imageUrl?: string;
  sizePx: number;
}

export interface ResolvedFleetLayout {
  backgroundColor: string;
  container: ContainerSize;
  media: ResolvedFleetMediaLayer | null;
  texts: ResolvedFleetTextLayer[];
  stickers: ResolvedFleetStickerLayer[];
}

/**
 * The core layout engine: takes a platform-agnostic `FleetContentData` document plus the current
 * container size, and returns fully-resolved pixel geometry for every layer (position, size, font
 * size, padding, border radius). Adapters only need to map this to their own render primitives —
 * no positioning/sizing math should live in an adapter.
 */
export const resolveFleetLayout = (
  content: FleetContentData,
  container: ContainerSize,
  options: ResolveFleetLayoutOptions = {},
): ResolvedFleetLayout => {
  const units = createContainerUnits(container);
  const minFontSizePx = options.minFontSizePx ?? FLEET_DEFAULT_MIN_FONT_SIZE_PX;
  const minStickerSizePx = options.minStickerSizePx ?? FLEET_DEFAULT_MIN_STICKER_SIZE_PX;

  return {
    backgroundColor: content.backgroundColor,
    container,
    media: resolveMediaLayer(content.media, container, units),
    texts: content.texts.map((text, index) => resolveTextLayer(text, index, container, units, minFontSizePx)),
    stickers: content.stickers.map((sticker, index) =>
      resolveStickerLayer(sticker, index, container, units, minStickerSizePx),
    ),
  };
};

const resolveMediaLayer = (
  media: FleetMediaEntity | null,
  container: ContainerSize,
  units: ContainerUnits,
): ResolvedFleetMediaLayer | null => {
  if (!media) return null;

  const placement = media.placement ?? FLEET_DEFAULT_PLACEMENT;
  const widthPx = units.cqw(100);
  const heightPx = (widthPx * (media.height ?? container.height)) / (media.width ?? container.width);

  return {
    type: "media",
    transform: placementToPixelTransform(placement, container),
    widthPx,
    heightPx,
    url: media.url,
    alt: media.alt,
  };
};

const resolveTextLayer = (
  text: FleetTextEntity,
  index: number,
  container: ContainerSize,
  units: ContainerUnits,
  minFontSizePx: number,
): ResolvedFleetTextLayer => {
  const fontSizePx = Math.max(units.cqh(3), minFontSizePx);

  return {
    type: "text",
    key: text.id ?? `${index}-${text.body}`,
    transform: placementToPixelTransform(text, container),
    body: text.body,
    textAlignment: text.textAlignment,
    color: text.color,
    backgroundColor: text.backgroundColor ?? "transparent",
    font: FLEET_FONTS[text.textStyle],
    fontSizePx,
    lineHeightPx: fontSizePx * 1.25,
    paddingVerticalPx: Math.max(units.cqh(1.2), FLEET_TEXT_PADDING_VERTICAL_PX),
    paddingHorizontalPx: Math.max(units.cqw(3.2), FLEET_TEXT_PADDING_HORIZONTAL_PX),
    borderRadiusPx: Math.max(units.cqw(1.5), FLEET_TEXT_BORDER_RADIUS_PX),
    maxWidthPx: units.cqw(90),
  };
};

const resolveStickerLayer = (
  sticker: FleetStickerEntity,
  index: number,
  container: ContainerSize,
  units: ContainerUnits,
  minStickerSizePx: number,
): ResolvedFleetStickerLayer => ({
  type: "sticker",
  key: sticker.id ?? `${index}-${sticker.emoji}`,
  transform: placementToPixelTransform(sticker, container),
  emoji: sticker.emoji,
  imageUrl: sticker.imageUrl,
  sizePx: Math.max(units.cqw(8), minStickerSizePx),
});
