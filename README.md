# fleet-renderer

A shared rendering engine for **Fleet** — Catalyst's Stories/Fleets-style ephemeral post format (background color + positioned media/text/sticker layers, auto-expiring after 24h).

Fleet content is a small canvas composition: one background, zero-or-one media layer, and any number of independently positioned/scaled/rotated text and sticker layers, all sharing a normalized `{ posX, posY, scale, rotation }` placement model. Historically this layout math (container-relative units, placement transforms, font mapping, overflow-safe clamping) was implemented independently in three places — a React Native app, a Next.js web app, and a satori-based server-side PNG renderer — with subtly different behavior in each. `fleet-renderer` centralizes that math into one dependency-free core, plus thin platform adapters.

## Packages

| Package                                            | Location                    | Description                                                                 |
| --------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `@natsuneko-laboratory/fleet-renderer-core`        | `packages/core`              | Platform-agnostic types, constants, and the pure `resolveFleetLayout` engine |
| `@natsuneko-laboratory/fleet-renderer-react-native`| `packages/react-native`      | React Native `<FleetCanvas>` renderer + editor placement helpers            |
| `@natsuneko-laboratory/fleet-renderer-react-dom`   | `packages/react-dom`         | React DOM `<FleetContent>` renderer (CSS `%`/`cqw`/`cqh` positioned), supports both read-only and editable-preview modes |
| `@natsuneko-laboratory/fleet-renderer-satori`      | `packages/satori`            | `buildFleetSatoriElement`, a pure JSX-tree builder for satori-based server-side PNG rendering |


## Design

- **`core` has zero framework dependencies.** It only exports types, constants, and pure functions (`resolveFleetLayout`, `pixelOffsetToPlacement`, `clampPlacementToCanvas`, `createContainerUnits`). Any platform can consume it — React, React Native, or plain Node.js.
- **Adapters own rendering, not layout math.** `resolveFleetLayout` returns fully-resolved pixel geometry (position, size, font size, padding, border radius) for every layer; a platform adapter's only job is mapping that to its own primitives (`View`/`Text`/`Image`, `<div>`/`<p>`/`<img>`, or satori JSX).
- **App-specific concerns stay out of core.** CDN URL rewriting and the `static.natsuneko.com/images/reactions/{symbol}.png` sticker convention are Catalyst-specific, not generic to "Fleet rendering" — adapters accept `resolveMediaUri`/`resolveStickerImageUrl` callbacks instead of hardcoding them, so this package stays reusable outside Catalyst.

## License

MIT by [@6jz](https://twitter.com/6jz)
