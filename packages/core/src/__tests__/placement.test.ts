import { describe, expect, it } from "vitest";
import {
  clampCenterToCanvas,
  clampPlacementToCanvas,
  computeBoundingRadiusPx,
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

describe("computeBoundingRadiusPx", () => {
  it("returns the scaled diagonal half-length", () => {
    expect(computeBoundingRadiusPx({ width: 6, height: 8 }, 1)).toBe(5);
    expect(computeBoundingRadiusPx({ width: 6, height: 8 }, 2)).toBe(10);
  });
});

describe("clampCenterToCanvas", () => {
  it("leaves a center untouched when it's already fully inside the safe area", () => {
    const result = clampCenterToCanvas({ centerXPx: 100, centerYPx: 100, radiusPx: 20, container: { width: 200, height: 200 } });
    expect(result).toEqual({ x: 100, y: 100 });
  });

  it("pulls an out-of-bounds center inward to the radius", () => {
    const result = clampCenterToCanvas({ centerXPx: -50, centerYPx: 500, radiusPx: 20, container: { width: 200, height: 200 } });
    expect(result).toEqual({ x: 20, y: 180 });
  });

  it("centers an axis when the bounding circle is larger than the canvas", () => {
    const result = clampCenterToCanvas({ centerXPx: 10, centerYPx: 10, radiusPx: 150, container: { width: 200, height: 200 } });
    expect(result).toEqual({ x: 100, y: 100 });
  });
});

describe("clampPlacementToCanvas", () => {
  it("keeps an in-bounds placement unchanged", () => {
    const placement = { posX: 0.5, posY: 0.5, scale: 1, rotation: 0 };
    const clamped = clampPlacementToCanvas(placement, { width: 100, height: 40 }, { width: 1000, height: 1000 });
    expect(clamped.posX).toBeCloseTo(0.5);
    expect(clamped.posY).toBeCloseTo(0.5);
  });

  it("pulls a heavily-scaled edge placement back inside the canvas", () => {
    const placement = { posX: 0, posY: 0, scale: 5, rotation: 0 };
    const clamped = clampPlacementToCanvas(placement, { width: 100, height: 100 }, { width: 1000, height: 1000 });
    expect(clamped.posX).toBeGreaterThan(0);
    expect(clamped.posY).toBeGreaterThan(0);
    expect(clamped.scale).toBe(5);
    expect(clamped.rotation).toBe(0);
  });
});
