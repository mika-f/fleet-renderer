import { describe, expect, it } from "vitest";
import type { FleetContentData } from "../types";
import { resolveFleetLayout } from "../layout";

const container = { width: 360, height: 640 };

describe("resolveFleetLayout", () => {
  it("resolves an empty fleet to just the background", () => {
    const content: FleetContentData = { backgroundColor: "#000000", media: null, texts: [], stickers: [] };
    const layout = resolveFleetLayout(content, container);

    expect(layout.backgroundColor).toBe("#000000");
    expect(layout.media).toBeNull();
    expect(layout.texts).toEqual([]);
    expect(layout.stickers).toEqual([]);
  });

  it("sizes media to full container width and preserves intrinsic aspect ratio", () => {
    const content: FleetContentData = {
      backgroundColor: "#000000",
      media: { url: "https://example.com/a.jpg", width: 1000, height: 500 },
      texts: [],
      stickers: [],
    };
    const layout = resolveFleetLayout(content, container);

    expect(layout.media?.widthPx).toBe(360);
    expect(layout.media?.heightPx).toBe(180); // 360 * (500/1000)
    expect(layout.media?.transform.translateX).toBe(0);
    expect(layout.media?.transform.translateY).toBe(0);
  });

  it("applies the default font-size floor for small containers", () => {
    const content: FleetContentData = {
      backgroundColor: "#000000",
      media: null,
      texts: [
        {
          body: "hello",
          textStyle: "default",
          textAlignment: "center",
          color: "#ffffff",
          posX: 0.5,
          posY: 0.5,
          scale: 1,
          rotation: 0,
        },
      ],
      stickers: [],
    };
    const layout = resolveFleetLayout(content, { width: 10, height: 10 });

    expect(layout.texts[0].fontSizePx).toBe(14); // floor wins over cqh(3) = 0.3
  });

  it("lets minFontSizePx be disabled for renderers that don't need a floor (e.g. fixed-size server canvas)", () => {
    const content: FleetContentData = {
      backgroundColor: "#000000",
      media: null,
      texts: [
        {
          body: "hello",
          textStyle: "bold",
          textAlignment: "left",
          color: "#ffffff",
          posX: 0.5,
          posY: 0.5,
          scale: 1,
          rotation: 0,
        },
      ],
      stickers: [],
    };
    const layout = resolveFleetLayout(content, { width: 2160, height: 3840 }, { minFontSizePx: 0 });

    expect(layout.texts[0].fontSizePx).toBeCloseTo((3840 * 3) / 100);
    expect(layout.texts[0].font.reactNativeFontFamily).toBe("Noto Sans JP Bold");
  });

  it("resolves sticker size with a floor and carries emoji/imageUrl through", () => {
    const content: FleetContentData = {
      backgroundColor: "#000000",
      media: null,
      texts: [],
      stickers: [{ emoji: "1f600", imageUrl: "https://example.com/1f600.png", posX: 0.2, posY: 0.8, scale: 1, rotation: 90 }],
    };
    const layout = resolveFleetLayout(content, container);

    expect(layout.stickers[0].sizePx).toBeCloseTo(Math.max((360 * 8) / 100, 28));
    expect(layout.stickers[0].imageUrl).toBe("https://example.com/1f600.png");
    expect(layout.stickers[0].transform.rotationDeg).toBe(90);
  });
});
