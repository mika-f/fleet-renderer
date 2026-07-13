import {
  FLEET_ASPECT_RATIO,
  type FleetContentData,
  type FleetMediaEntity,
  type ResolveFleetLayoutOptions,
  resolveFleetLayout,
} from "@natsuneko-laboratory/fleet-renderer-core";
import type { ComponentType } from "react";
import { useMemo } from "react";
import { Image, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useFleetContainer } from "./use-fleet-container";

export interface FleetImageProps {
  uri: string;
  alt?: string;
  style: { width: number; height: number };
  contentFit: "cover" | "contain";
  onLoad?: () => void;
}

/**
 * Bare `Image` fallback. Real apps should pass a CDN-aware `ImageComponent`
 * (e.g. `expo-image` wired to their own image proxy) via {@link FleetCanvasProps.ImageComponent}.
 */
const DefaultFleetImage = ({ uri, alt, style, contentFit, onLoad }: FleetImageProps) => (
  <Image
    source={{ uri }}
    accessibilityLabel={alt}
    style={style}
    resizeMode={contentFit}
    onLoad={onLoad}
  />
);

export interface FleetStickerLike {
  emoji: string;
  imageUrl?: string;
}

export interface FleetCanvasProps {
  fleet: FleetContentData;
  aspectRatio?: number;
  style?: ViewStyle;
  /** Pluggable image renderer, so apps can route media through their own CDN/caching image component. */
  ImageComponent?: ComponentType<FleetImageProps>;
  /** Resolves the URI to fetch for the background media. Defaults to `media.url` verbatim. */
  resolveMediaUri?: (media: FleetMediaEntity, containerWidthPx: number) => string;
  /** Resolves a sticker's image URL (e.g. a CDN convention for reaction symbols). Falls back to literal emoji text when it returns `undefined`. */
  resolveStickerImageUrl?: (sticker: FleetStickerLike) => string | undefined;
  /** Shown in place of an empty text body — intended for editor previews, not read-only viewers. */
  emptyTextPlaceholder?: string;
  layoutOptions?: ResolveFleetLayoutOptions;
  onMediaLoad?: () => void;
}

const styles = StyleSheet.create({
  outer: {
    alignItems: "center",
    height: "100%",
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  centeredLayer: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});

/** Read-only Fleet renderer: lays out background media, positioned text, and stickers per `resolveFleetLayout`. */
export const FleetCanvas = ({
  fleet,
  aspectRatio = FLEET_ASPECT_RATIO,
  style,
  ImageComponent = DefaultFleetImage,
  resolveMediaUri = (media) => media.url,
  resolveStickerImageUrl = (sticker) => sticker.imageUrl,
  emptyTextPlaceholder,
  layoutOptions,
  onMediaLoad,
}: FleetCanvasProps) => {
  const { containerWidth, containerHeight, onLayout } = useFleetContainer();

  const layout = useMemo(
    () => resolveFleetLayout(fleet, { width: containerWidth, height: containerHeight }, layoutOptions),
    [fleet, containerWidth, containerHeight, layoutOptions],
  );

  return (
    <View style={[styles.outer, { backgroundColor: layout.backgroundColor }, style]}>
      <View style={{ aspectRatio, width: "100%", height: "auto" }} onLayout={onLayout}>
        {layout.media && fleet.media ? (
          <View
            pointerEvents="none"
            style={[
              styles.centeredLayer,
              {
                transform: [
                  { translateX: layout.media.transform.translateX },
                  { translateY: layout.media.transform.translateY },
                  { scale: layout.media.transform.scale },
                  { rotate: `${layout.media.transform.rotationDeg}deg` },
                ],
              },
            ]}
          >
            <ImageComponent
              uri={resolveMediaUri(fleet.media, containerWidth)}
              alt={layout.media.alt}
              contentFit="cover"
              onLoad={onMediaLoad}
              style={{ width: layout.media.widthPx, height: layout.media.heightPx }}
            />
          </View>
        ) : null}

        {layout.texts.map((text) => (
          <View
            key={text.key}
            pointerEvents="none"
            style={[
              styles.centeredLayer,
              {
                transform: [
                  { translateX: text.transform.translateX },
                  { translateY: text.transform.translateY },
                  { scale: text.transform.scale },
                  { rotate: `${text.transform.rotationDeg}deg` },
                ],
              },
            ]}
          >
            <Text
              style={{
                backgroundColor: text.backgroundColor,
                borderRadius: text.borderRadiusPx,
                color: text.color,
                fontFamily: text.font.reactNativeFontFamily,
                fontSize: text.fontSizePx,
                lineHeight: text.lineHeightPx,
                maxWidth: text.maxWidthPx,
                paddingHorizontal: text.paddingHorizontalPx,
                paddingVertical: text.paddingVerticalPx,
                textAlign: text.textAlignment,
                textShadowColor: "rgba(0, 0, 0, 0.45)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 6,
              }}
            >
              {text.body || emptyTextPlaceholder}
            </Text>
          </View>
        ))}

        {layout.stickers.map((sticker) => {
          const imageUrl = resolveStickerImageUrl(sticker);

          return (
            <View
              key={sticker.key}
              pointerEvents="none"
              style={[
                styles.centeredLayer,
                {
                  transform: [
                    { translateX: sticker.transform.translateX },
                    { translateY: sticker.transform.translateY },
                    { scale: sticker.transform.scale },
                    { rotate: `${sticker.transform.rotationDeg}deg` },
                  ],
                },
              ]}
            >
              {imageUrl ? (
                <ImageComponent
                  uri={imageUrl}
                  contentFit="contain"
                  style={{ width: sticker.sizePx, height: sticker.sizePx }}
                />
              ) : (
                <Text style={{ fontSize: sticker.sizePx }}>{sticker.emoji}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};
