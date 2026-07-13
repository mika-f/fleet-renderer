import { type ContainerUnits, createContainerUnits } from "@natsuneko-laboratory/fleet-renderer-core";
import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

export interface UseFleetContainerResult extends ContainerUnits {
  containerWidth: number;
  containerHeight: number;
  onLayout: (event: LayoutChangeEvent) => void;
}

const INITIAL_SIZE = { width: 0, height: 0 };

/** Tracks a View's measured size via `onLayout` and exposes it alongside `cqw`/`cqh`/`cqmin`/`cqmax` helpers. */
export const useFleetContainer = (): UseFleetContainerResult => {
  const [size, setSize] = useState(INITIAL_SIZE);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
  }, []);

  return {
    containerWidth: size.width,
    containerHeight: size.height,
    onLayout,
    ...createContainerUnits(size),
  };
};
