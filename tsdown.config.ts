import { defineConfig } from 'tsdown/config'

export default defineConfig({
  entry: {
    index: "src/index.ts",
    editor: "src/survey-editor/index.ts"
  },
  copy: [
    {
      from: "package.json",
      to: "build/package.json"
    }
  ],
  format: "esm",
  dts: true,
  outDir: "build",
  sourcemap: true,
})
