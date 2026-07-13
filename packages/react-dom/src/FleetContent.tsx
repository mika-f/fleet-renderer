import {
  FLEET_FONTS,
  type FleetContentData,
  type FleetTextStyle,
} from "@natsuneko-laboratory/fleet-renderer-core";
import type { ComponentType, CSSProperties, PointerEvent, ReactNode } from "react";

export interface FleetMediaImageProps {
  src: string;
  alt?: string;
  /** Intrinsic media width, when known — useful for CDN-aware image components to pick a variant. */
  width?: number;
  style?: CSSProperties;
  className?: string;
  onLoad?: () => void;
}

export interface FleetStickerLike {
  emoji: string;
  imageUrl?: string;
}

const DefaultFleetMediaImage = ({ src, alt, style, className, onLoad }: FleetMediaImageProps) => (
  // eslint-disable-next-line jsx-a11y/alt-text
  <img src={src} alt={alt} style={style} className={className} onLoad={onLoad} />
);

export interface FleetContentProps {
  fleet: FleetContentData;
  className?: string;
  /** Pluggable media renderer, so apps can route the background image through their own CDN/image component. */
  MediaImageComponent?: ComponentType<FleetMediaImageProps>;
  /** Resolves a sticker's image URL (e.g. a CDN convention for reaction symbols). Falls back to literal emoji text when it returns `undefined`. */
  resolveStickerImageUrl?: (sticker: FleetStickerLike) => string | undefined;
  /** Maps a text style to a CSS class (e.g. a Tailwind font utility). When omitted, falls back to an inline `font-family` from `FLEET_FONTS`. */
  fontClassName?: (style: FleetTextStyle) => string | undefined;
  /** Shown in place of an empty text body — intended for editor previews, not read-only viewers. */
  emptyTextPlaceholder?: ReactNode;
  onMediaLoad?: () => void;

  // Editable-mode extension points (all optional; omit for a read-only viewer).
  onTextPointerDown?: (e: PointerEvent<HTMLDivElement>, index: number) => void;
  onMediaPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
  onStickerPointerDown?: (e: PointerEvent<HTMLDivElement>, index: number) => void;
  selectedTextIndex?: number | null;
  selectedStickerIndex?: number | null;
  isMediaSelected?: boolean;
  /** Applied to a layer's wrapper when it's the selected one in editable mode. */
  selectionStyle?: CSSProperties;
}

const DEFAULT_SELECTION_STYLE: CSSProperties = { outline: "2px solid currentColor", outlineOffset: "2px" };
const DEFAULT_MEDIA_PLACEMENT = { posX: 0.5, posY: 0.5, scale: 1, rotation: 0 };

/**
 * Read-only-by-default Fleet renderer for the DOM, positioned with CSS `%`/`cqw`/`cqh` units (the
 * container establishes `container-type: size`) rather than JS-computed pixel geometry — the web
 * platform has native container query support, so there's no need to replicate the pixel math
 * `resolveFleetLayout` uses for React Native/satori.
 *
 * Passing any of the `on*PointerDown` handlers switches the corresponding layer into "editable"
 * mode (grab cursor, pointer events enabled); omitting all of them renders a plain read-only view.
 */
export const FleetContent = ({
  fleet,
  className,
  MediaImageComponent = DefaultFleetMediaImage,
  resolveStickerImageUrl = (sticker) => sticker.imageUrl,
  fontClassName,
  emptyTextPlaceholder,
  onMediaLoad,
  onTextPointerDown,
  onMediaPointerDown,
  onStickerPointerDown,
  selectedTextIndex,
  selectedStickerIndex,
  isMediaSelected,
  selectionStyle = DEFAULT_SELECTION_STYLE,
}: FleetContentProps) => {
  const mediaPlacement = fleet.media?.placement ?? DEFAULT_MEDIA_PLACEMENT;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: fleet.backgroundColor,
        containerType: "size",
      }}
    >
      {fleet.media ? (
        <div
          style={{
            position: "absolute",
            left: `${mediaPlacement.posX * 100}%`,
            top: `${mediaPlacement.posY * 100}%`,
            transform: `translate(-50%, -50%) scale(${mediaPlacement.scale}) rotate(${mediaPlacement.rotation}deg)`,
            cursor: onMediaPointerDown ? "grab" : undefined,
            ...(isMediaSelected ? selectionStyle : null),
          }}
          onPointerDown={onMediaPointerDown}
        >
          <MediaImageComponent
            src={fleet.media.url}
            alt={fleet.media.alt}
            width={fleet.media.width}
            style={{ width: "100cqw", maxWidth: "none" }}
            onLoad={onMediaLoad}
          />
        </div>
      ) : null}

      {fleet.texts.map((text, index) => {
        const font = FLEET_FONTS[text.textStyle];
        const textClassName = fontClassName?.(text.textStyle);

        return (
          <div
            key={text.id ?? `${index}-${text.body}`}
            style={{
              position: "absolute",
              left: `${text.posX * 100}%`,
              top: `${text.posY * 100}%`,
              transform: `translate(-50%, -50%) scale(${text.scale}) rotate(${text.rotation}deg)`,
              color: text.color,
              textAlign: text.textAlignment,
              width: "max-content",
              maxWidth: "90cqw",
              fontFamily: textClassName ? undefined : font.cssFontFamily,
              fontWeight: textClassName ? undefined : font.weight,
              cursor: onTextPointerDown ? "grab" : undefined,
              userSelect: onTextPointerDown ? undefined : "none",
              pointerEvents: onTextPointerDown ? undefined : "none",
              ...(selectedTextIndex === index ? selectionStyle : null),
            }}
            className={textClassName}
            onPointerDown={onTextPointerDown ? (e) => onTextPointerDown(e, index) : undefined}
          >
            <p
              style={{
                whiteSpace: "pre-wrap",
                fontSize: "3cqh",
                padding: "1.2cqh 3.2cqw",
                borderRadius: "1.5cqw",
                backgroundColor: text.backgroundColor ?? "transparent",
                filter: "drop-shadow(0 0.2cqh 0.4cqh rgba(0,0,0,0.5))",
              }}
            >
              {text.body || emptyTextPlaceholder}
            </p>
          </div>
        );
      })}

      {fleet.stickers.map((sticker, index) => {
        const imageUrl = resolveStickerImageUrl(sticker);

        return (
          <div
            key={sticker.id ?? `${index}-${sticker.emoji}`}
            style={{
              position: "absolute",
              left: `${sticker.posX * 100}%`,
              top: `${sticker.posY * 100}%`,
              transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
              cursor: onStickerPointerDown ? "grab" : undefined,
              userSelect: onStickerPointerDown ? undefined : "none",
              pointerEvents: onStickerPointerDown ? undefined : "none",
              ...(selectedStickerIndex === index ? selectionStyle : null),
            }}
            onPointerDown={onStickerPointerDown ? (e) => onStickerPointerDown(e, index) : undefined}
          >
            {imageUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={imageUrl} alt={sticker.emoji} style={{ width: "8cqw", height: "8cqw" }} />
            ) : (
              <span style={{ fontSize: "8cqw" }}>{sticker.emoji}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
