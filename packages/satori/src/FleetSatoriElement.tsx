import {
  clampPlacementToCanvas,
  type ContainerSize,
  type FleetContentData,
  resolveFleetLayout,
} from "@natsuneko-laboratory/fleet-renderer-core";
import type { ReactNode } from "react";

// Unlike the react-native/react-dom adapters, `react` is bundled (not externalized) in this
// package's build — see package.json's `build` script. Satori never mounts these elements through
// real React reconciliation (no hooks, no dispatcher, no live component tree — it just walks a
// plain `{ $$typeof, type, props }` tree), so there's no "two live React instances" risk the other
// adapters have to avoid. Bundling instead sidesteps a real problem: a plain `require("react/jsx-
// runtime")` left external only resolves when something bundler-aware (Metro, webpack) loads this
// package; a bare `node -e` require (and, it turns out, Vitest's SSR module loader) can't find
// `react` from this package's own location at all, since it isn't anywhere in its node_modules
// ancestry.

export interface FleetSatoriMedia {
  /** Pre-fetched image satori can embed directly (typically a `data:` URI — satori can't fetch remote URLs itself). */
  src: string;
  /**
   * Real, measured dimensions of the fetched image bytes — deliberately separate from whatever
   * `fleet.media.width`/`height` say, since a CDN variant's actual served aspect ratio can drift
   * from a stale DB-stored value. Letterboxing math is only correct against the real bytes.
   */
  width: number;
  height: number;
}

export interface FleetStickerLike {
  emoji: string;
  imageUrl?: string;
}

export interface FleetTextBoxSize {
  width: number;
  height: number;
}

export interface BuildFleetSatoriElementOptions {
  canvas: ContainerSize;
  /** Pre-fetched background image. Omit to skip the media layer entirely (e.g. a measure-only pass). */
  media?: FleetSatoriMedia;
  /** Resolves a sticker's satori-embeddable image src. Omit (or return `undefined`) to skip that sticker. */
  resolveStickerSrc?: (sticker: FleetStickerLike) => string | undefined;
  /**
   * Natural (unscaled, unrotated) text box sizes from a prior satori measure pass (via satori's own
   * `onNodeDetected`), keyed by text index — satori is the only thing that can measure how a piece
   * of text actually lays out, so this can't be precomputed by `resolveFleetLayout`. When provided,
   * text positions are pulled inward via `clampPlacementToCanvas` so a heavily scaled/rotated text
   * box can't visually clip the canvas edge. Omit for the measure pass itself: natural (1x scale,
   * 0deg), unclamped, unrotated boxes are what should be measured in the first place.
   */
  textBoxes?: Map<number, FleetTextBoxSize>;
}

/**
 * Builds the satori-compatible JSX element tree for a Fleet — pure, synchronous, no I/O. Image
 * fetching (media/stickers), font loading, the two-pass text measurement technique, and the actual
 * `satori()` → resvg → sharp rasterization pipeline all stay the server's own concern: they need
 * Node `fs`, network access, and satori's own `onNodeDetected` hook, none of which this
 * dependency-free package should own.
 */
export const buildFleetSatoriElement = (
  fleet: FleetContentData,
  options: BuildFleetSatoriElementOptions,
): ReactNode => {
  const { canvas, media, resolveStickerSrc = () => undefined, textBoxes } = options;

  // Reuses the shared layout math (font size, padding, border radius, sticker size, media
  // width/height) for everything except *position* — text/sticker positions may still need
  // overflow clamping below, which resolveFleetLayout can't do on its own (see textBoxes above).
  const layoutFleet: FleetContentData = {
    ...fleet,
    media: media && fleet.media ? { ...fleet.media, width: media.width, height: media.height } : null,
  };
  const layout = resolveFleetLayout(layoutFleet, canvas, { minFontSizePx: 0, minStickerSizePx: 0 });

  return (
    <div
      style={{
        width: canvas.width,
        height: canvas.height,
        backgroundColor: fleet.backgroundColor,
        position: "relative",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/*
        Layer anchoring note: every layer positions its own top-left in px (`center - size / 2`)
        instead of the CSS-idiomatic `left: center; transform: translate(-50%, -50%)`. satori's
        percentage-translate support is unreliable for elements containing text — it translates the
        background rect but leaves the glyphs at the untranslated position, so text renders anchored
        by its top-left corner and gets clipped at the canvas' right edge. Since box sizes are known
        here (media/sticker sizes from layout, text boxes from the measure pass), px anchoring is
        exact and sidesteps the whole problem. scale()/rotate() stay in `transform`, which satori
        applies about the element center as CSS does.
      */}
      {layout.media && media ? (
        <div
          style={{
            position: "absolute",
            left: (fleet.media?.placement?.posX ?? 0.5) * canvas.width - canvas.width / 2,
            top: (fleet.media?.placement?.posY ?? 0.5) * canvas.height - Math.round(layout.media.heightPx) / 2,
            transform: `scale(${layout.media.transform.scale}) rotate(${layout.media.transform.rotationDeg}deg)`,
            display: "flex",
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={media.src}
            alt={layout.media.alt}
            width={canvas.width}
            height={Math.round(layout.media.heightPx)}
            style={{ flexShrink: 0 }}
          />
        </div>
      ) : null}

      {layout.texts.map((text, index) => {
        const original = fleet.texts[index];
        const box = textBoxes?.get(index);

        if (!box) {
          // Measure pass: natural (1x scale, 0deg) box, anchored at the canvas origin — satori
          // just needs somewhere to lay out the flex line, and anchoring at (0, 0) keeps the
          // measurement free of any edge-proximity constraints. Applying scale/rotate here would
          // report an already-transformed size, corrupting the bounding-box math the final pass needs.
          return (
            <div
              key={`text-${index}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                display: "flex",
                maxWidth: text.maxWidthPx,
                fontFamily: text.font.satoriFontName,
                fontWeight: text.font.weight,
              }}
            >
              <p
                style={{
                  fontSize: text.fontSizePx,
                  padding: `${text.paddingVerticalPx}px ${text.paddingHorizontalPx}px`,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {text.body}
              </p>
            </div>
          );
        }

        const placement = clampPlacementToCanvas(original, box, canvas);

        return (
          <div
            key={`text-${index}`}
            style={{
              position: "absolute",
              left: placement.posX * canvas.width - box.width / 2,
              top: placement.posY * canvas.height - box.height / 2,
              // Fixing the width to the measured box keeps this pass' line breaking identical to
              // the measure pass, so the px anchoring above stays exact. satori reports node.width
              // rounded to an integer, which can sit just below the true fractional content width —
              // handing that value straight back would re-wrap the last glyph, so pad it by 1px.
              width: Math.ceil(box.width) + 1,
              transform: `scale(${placement.scale}) rotate(${placement.rotation}deg)`,
              color: text.color,
              textAlign: text.textAlignment,
              display: "flex",
              maxWidth: text.maxWidthPx,
              fontFamily: text.font.satoriFontName,
              fontWeight: text.font.weight,
            }}
          >
            <p
              style={{
                fontSize: text.fontSizePx,
                padding: `${text.paddingVerticalPx}px ${text.paddingHorizontalPx}px`,
                borderRadius: text.borderRadiusPx,
                backgroundColor: text.backgroundColor,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {text.body}
            </p>
          </div>
        );
      })}

      {layout.stickers.map((sticker, index) => {
        const src = resolveStickerSrc(sticker);
        if (!src) return null;

        const original = fleet.stickers[index];
        const placement = clampPlacementToCanvas(
          original,
          { width: sticker.sizePx, height: sticker.sizePx },
          canvas,
        );

        return (
          <div
            key={`sticker-${index}`}
            style={{
              position: "absolute",
              left: placement.posX * canvas.width - sticker.sizePx / 2,
              top: placement.posY * canvas.height - sticker.sizePx / 2,
              transform: `scale(${placement.scale}) rotate(${placement.rotation}deg)`,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={src} alt={sticker.emoji} width={sticker.sizePx} height={sticker.sizePx} />
          </div>
        );
      })}
    </div>
  );
};
