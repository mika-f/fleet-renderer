import { describe, expect, it } from "vitest";
import {
  clampCenterToCanvas,
  clampPlacementToCanvas,
  computeBoundingHalfExtentsPx,
  pixelOffsetToPlacement,
  placementToPixelTransform,
} from "../placement";

describe("placementToPixelTransform", () => {
  it("centers a placement of (0.5, 0.5) at the container origin", () => {
    const transform = placementToPixelTransform({ posX: 0.5, posY: 0.5, scale: 1, rotation: 0 }, { width: 200, height: 400 });
    expect(transform.translateX).toBe(0);
    expect(transform.translateY).toBe(0);
  });

  it("offsets proportionally to container size", () => {
    const transform = placementToPixelTransform({ posX: 1, posY: 0, scale: 2, rotation: 45 }, { width: 200, height: 400 });
    expect(transform.translateX).toBe(100);
    expect(transform.translateY).toBe(-200);
    expect(transform.scale).toBe(2);
    expect(transform.rotationDeg).toBe(45);
  });
});

describe("pixelOffsetToPlacement", () => {
  it("is the inverse of placementToPixelTransform's translation", () => {
    const container = { width: 300, height: 600 };
    const original = { posX: 0.75, posY: 0.2, scale: 1.5, rotation: -30 };
    const transform = placementToPixelTransform(original, container);
    const roundTripped = pixelOffsetToPlacement(transform.translateX, transform.translateY, container, original.scale, original.rotation);

    expect(roundTripped.posX).toBeCloseTo(original.posX);
    expect(roundTripped.posY).toBeCloseTo(original.posY);
  });

  it("falls back to the center when the container has no size yet", () => {
    const placement = pixelOffsetToPlacement(50, 50, { width: 0, height: 0 }, 1, 0);
    expect(placement.posX).toBe(0.5);
    expect(placement.posY).toBe(0.5);
  });
});

describe("computeBoundingHalfExtentsPx", () => {
  it("returns the scaled box half-extents when unrotated", () => {
    expect(computeBoundingHalfExtentsPx({ width: 6, height: 8 }, 1, 0)).toEqual({ halfWidthPx: 3, halfHeightPx: 4 });
    expect(computeBoundingHalfExtentsPx({ width: 6, height: 8 }, 2, 0)).toEqual({ halfWidthPx: 6, halfHeightPx: 8 });
  });

  it("swaps the extents at a 90 degree rotation", () => {
    const extents = computeBoundingHalfExtentsPx({ width: 6, height: 8 }, 1, 90);
    expect(extents.halfWidthPx).toBeCloseTo(4);
    expect(extents.halfHeightPx).toBeCloseTo(3);
  });

  it("grows toward the diagonal at 45 degrees", () => {
    const extents = computeBoundingHalfExtentsPx({ width: 10, height: 10 }, 1, 45);
    expect(extents.halfWidthPx).toBeCloseTo(Math.hypot(5, 5));
    expect(extents.halfHeightPx).toBeCloseTo(Math.hypot(5, 5));
  });
});

describe("clampCenterToCanvas", () => {
  it("leaves a center untouched when it's already fully inside the safe area", () => {
    const result = clampCenterToCanvas({
      centerXPx: 100,
      centerYPx: 100,
      halfExtents: { halfWidthPx: 20, halfHeightPx: 20 },
      container: { width: 200, height: 200 },
    });
    expect(result).toEqual({ x: 100, y: 100 });
  });

  it("pulls an out-of-bounds center inward to the half-extent", () => {
    const result = clampCenterToCanvas({
      centerXPx: -50,
      centerYPx: 500,
      halfExtents: { halfWidthPx: 20, halfHeightPx: 30 },
      container: { width: 200, height: 200 },
    });
    expect(result).toEqual({ x: 20, y: 170 });
  });

  it("centers an axis when the bounding box is larger than the canvas", () => {
    const result = clampCenterToCanvas({
      centerXPx: 10,
      centerYPx: 10,
      halfExtents: { halfWidthPx: 150, halfHeightPx: 20 },
      container: { width: 200, height: 200 },
    });
    expect(result).toEqual({ x: 100, y: 20 });
  });
});

describe("clampPlacementToCanvas", () => {
  it("keeps an in-bounds placement unchanged", () => {
    const placement = { posX: 0.5, posY: 0.5, scale: 1, rotation: 0 };
    const clamped = clampPlacementToCanvas(placement, { width: 100, height: 40 }, { width: 1000, height: 1000 });
    expect(clamped.posX).toBeCloseTo(0.5);
    expect(clamped.posY).toBeCloseTo(0.5);
  });

  it("does not displace a wide, unrotated box that fits vertically near the top edge", () => {
    // 幅広テキストの外接円半径は対角線の半分（≈390px）だが、回転していない箱に必要な
    // 上方向マージンは高さの半分（50px）だけ。過剰クランプで押し下げられないことを確認する。
    const placement = { posX: 0.5, posY: 0.08, scale: 1, rotation: 0 };
    const clamped = clampPlacementToCanvas(placement, { width: 760, height: 100 }, { width: 1000, height: 2000 });
    expect(clamped.posX).toBeCloseTo(0.5);
    expect(clamped.posY).toBeCloseTo(0.08);
  });

  it("pulls a heavily-scaled edge placement back inside the canvas", () => {
    const placement = { posX: 0, posY: 0, scale: 5, rotation: 0 };
    const clamped = clampPlacementToCanvas(placement, { width: 100, height: 100 }, { width: 1000, height: 1000 });
    expect(clamped.posX).toBeGreaterThan(0);
    expect(clamped.posY).toBeGreaterThan(0);
    expect(clamped.scale).toBe(5);
    expect(clamped.rotation).toBe(0);
  });

  it("accounts for rotation when computing the required clearance", () => {
    // 90度回転した縦長の箱は幅と高さが入れ替わる：幅 40 x 高さ 400 の箱を90度回転させると
    // 横方向に 400px 分の空きが必要になる。
    const placement = { posX: 0.05, posY: 0.5, scale: 1, rotation: 90 };
    const clamped = clampPlacementToCanvas(placement, { width: 40, height: 400 }, { width: 1000, height: 1000 });
    expect(clamped.posX).toBeCloseTo(0.2);
    expect(clamped.posY).toBeCloseTo(0.5);
  });
});
