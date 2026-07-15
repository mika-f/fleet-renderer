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

export interface BoundingHalfExtentsPx {
  halfWidthPx: number;
  halfHeightPx: number;
}

/**
 * Half-extents (px) of the axis-aligned bounding box of a `width` x `height` box after applying
 * `scale` and `rotationDeg` about its own center. Exact for rectangles — unlike a bounding-circle
 * radius (diagonal half-length), which grossly overestimates the needed clearance for wide,
 * unrotated boxes (e.g. a full-width text pill) and would pull them far away from the edge.
 */
export const computeBoundingHalfExtentsPx = (
  box: BoundingBoxPx,
  scale: number,
  rotationDeg: number,
): BoundingHalfExtentsPx => {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  return {
    halfWidthPx: ((box.width * cos + box.height * sin) / 2) * scale,
    halfHeightPx: ((box.width * sin + box.height * cos) / 2) * scale,
  };
};

export interface ClampCenterToCanvasOptions {
  centerXPx: number;
  centerYPx: number;
  halfExtents: BoundingHalfExtentsPx;
  container: ContainerSize;
}

/**
 * Pulls a layer's center inward, per axis, so its bounding box never crosses the canvas edge.
 * If the box is larger than the canvas along an axis, that axis is centered instead of clamped.
 */
export const clampCenterToCanvas = ({
  centerXPx,
  centerYPx,
  halfExtents,
  container,
}: ClampCenterToCanvasOptions): { x: number; y: number } => {
  const clampAxis = (center: number, size: number, halfExtent: number) => {
    if (halfExtent * 2 >= size) return size / 2;
    return Math.min(Math.max(center, halfExtent), size - halfExtent);
  };

  return {
    x: clampAxis(centerXPx, container.width, halfExtents.halfWidthPx),
    y: clampAxis(centerYPx, container.height, halfExtents.halfHeightPx),
  };
};

/**
 * Convenience wrapper combining {@link placementToPixelTransform}, {@link computeBoundingHalfExtentsPx},
 * and {@link clampCenterToCanvas}: returns a `FleetPlacement` whose `posX`/`posY` have been pulled
 * inward so the box never visually clips the canvas edge. Scale/rotation pass through unchanged.
 */
export const clampPlacementToCanvas = (
  placement: FleetPlacement,
  box: BoundingBoxPx,
  container: ContainerSize,
): FleetPlacement => {
  const transform = placementToPixelTransform(placement, container);
  const halfExtents = computeBoundingHalfExtentsPx(box, placement.scale, placement.rotation);
  const centerXPx = container.width / 2 + transform.translateX;
  const centerYPx = container.height / 2 + transform.translateY;

  const clamped = clampCenterToCanvas({ centerXPx, centerYPx, halfExtents, container });

  return {
    ...placement,
    posX: container.width > 0 ? clamped.x / container.width : placement.posX,
    posY: container.height > 0 ? clamped.y / container.height : placement.posY,
  };
};
