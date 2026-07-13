import type { ContainerSize, FleetPlacement } from "./types";

export interface PixelTransform {
  /** Translation from container center, in px. */
  translateX: number;
  translateY: number;
  scale: number;
  rotationDeg: number;
}

/**
 * Converts a normalized `FleetPlacement` into a container-relative pixel transform:
 * `translate = (pos - 0.5) * containerSize`. This is the transform every layer kind
 * (media/text/sticker) applies identically, anchored at the layer's own center.
 */
export const placementToPixelTransform = (placement: FleetPlacement, container: ContainerSize): PixelTransform => ({
  translateX: (placement.posX - 0.5) * container.width,
  translateY: (placement.posY - 0.5) * container.height,
  scale: placement.scale,
  rotationDeg: placement.rotation,
});

/**
 * Inverse of {@link placementToPixelTransform}'s translation: converts a container-relative pixel
 * offset (e.g. accumulated from a drag gesture, starting at the container center) back into a
 * normalized `FleetPlacement`. Used by editors while a layer is being dragged/pinched/rotated.
 */
export const pixelOffsetToPlacement = (
  offsetXPx: number,
  offsetYPx: number,
  container: ContainerSize,
  scale: number,
  rotation: number,
): FleetPlacement => ({
  posX: container.width > 0 ? offsetXPx / container.width + 0.5 : 0.5,
  posY: container.height > 0 ? offsetYPx / container.height + 0.5 : 0.5,
  scale,
  rotation,
});

export interface BoundingBoxPx {
  width: number;
  height: number;
}

/**
 * Radius (px) of the circle that fully contains a `width` x `height` box at the given `scale`,
 * regardless of rotation — i.e. the box's diagonal half-length. Rotation-safe by construction,
 * since a box's bounding circle doesn't change as it spins about its own center.
 */
export const computeBoundingRadiusPx = (box: BoundingBoxPx, scale: number): number =>
  Math.hypot(box.width / 2, box.height / 2) * scale;

export interface ClampCenterToCanvasOptions {
  centerXPx: number;
  centerYPx: number;
  radiusPx: number;
  container: ContainerSize;
}

/**
 * Pulls a layer's center inward, per axis, so its bounding circle never crosses the canvas edge.
 * If the circle is larger than the canvas along an axis, that axis is centered instead of clamped.
 */
export const clampCenterToCanvas = ({
  centerXPx,
  centerYPx,
  radiusPx,
  container,
}: ClampCenterToCanvasOptions): { x: number; y: number } => {
  const clampAxis = (center: number, size: number) => {
    if (radiusPx * 2 >= size) return size / 2;
    return Math.min(Math.max(center, radiusPx), size - radiusPx);
  };

  return {
    x: clampAxis(centerXPx, container.width),
    y: clampAxis(centerYPx, container.height),
  };
};

/**
 * Convenience wrapper combining {@link placementToPixelTransform}, {@link computeBoundingRadiusPx},
 * and {@link clampCenterToCanvas}: returns a `FleetPlacement` whose `posX`/`posY` have been pulled
 * inward so the box never visually clips the canvas edge. Scale/rotation pass through unchanged.
 */
export const clampPlacementToCanvas = (
  placement: FleetPlacement,
  box: BoundingBoxPx,
  container: ContainerSize,
): FleetPlacement => {
  const transform = placementToPixelTransform(placement, container);
  const radiusPx = computeBoundingRadiusPx(box, placement.scale);
  const centerXPx = container.width / 2 + transform.translateX;
  const centerYPx = container.height / 2 + transform.translateY;

  const clamped = clampCenterToCanvas({ centerXPx, centerYPx, radiusPx, container });

  return {
    ...placement,
    posX: container.width > 0 ? clamped.x / container.width : placement.posX,
    posY: container.height > 0 ? clamped.y / container.height : placement.posY,
  };
};
