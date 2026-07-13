import type { ContainerSize } from "./types";

export interface ContainerUnits {
  /** `value`% of the container width, in px. */
  cqw: (value: number) => number;
  /** `value`% of the container height, in px. */
  cqh: (value: number) => number;
  /** `value`% of `min(width, height)`, in px. */
  cqmin: (value: number) => number;
  /** `value`% of `max(width, height)`, in px. */
  cqmax: (value: number) => number;
}

/**
 * CSS container-query-unit equivalents (`cqw`/`cqh`/`cqmin`/`cqmax`) computed from a raw
 * `{ width, height }` pair, so the same formulas work whether the size comes from a browser
 * `ResizeObserver`, React Native's `onLayout`, or a fixed server-side render target.
 */
export const createContainerUnits = (container: ContainerSize): ContainerUnits => ({
  cqw: (value: number) => (container.width * value) / 100,
  cqh: (value: number) => (container.height * value) / 100,
  cqmin: (value: number) => (Math.min(container.width, container.height) * value) / 100,
  cqmax: (value: number) => (Math.max(container.width, container.height) * value) / 100,
});
