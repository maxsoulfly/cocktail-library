import path from "node:path"
import { defineConfig } from "vitest/config"

// Separate from vite.config.ts on purpose: that file wires in Figma Make's
// dev-server/HTML-transform plugins, which are irrelevant (and unnecessary
// overhead) for running plain unit tests against src/domain/.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
})
