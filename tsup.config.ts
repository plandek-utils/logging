import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/mod.ts"],
  format: ["esm"],
  dts: false, // we'll generate .d.ts files using tsc
  clean: true,
  minify: false,
  sourcemap: true,
  target: "es2020",
});
