import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["@natsuneko-laboratory/fleet-renderer-core"],
  // `react` is a devDependency (needed to build) but deliberately bundled, not externalized — see
  // the doc comment in src/FleetSatoriElement.tsx for why. tsup treats package.json dependencies/
  // peerDependencies as external by default; `noExternal` overrides that for these two specifically.
  noExternal: ["react", "react/jsx-runtime"],
});
