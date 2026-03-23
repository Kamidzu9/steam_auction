import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
    environment: "jsdom",
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
});
