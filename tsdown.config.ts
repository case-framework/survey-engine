import { defineConfig } from 'tsdown/config'

export default defineConfig({
  entry: "src/**/*.ts",
  copy: [
    {
      from: "package.json",
      to: "build/package.json"
    }
  ],
  format: "cjs",
  dts: true,
  outDir: "build",
  sourcemap: true,
})
