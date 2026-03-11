import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals:     true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include:  [
        "src/lib/services/**",
        "src/lib/rateLimit.ts",
        "src/lib/cache/**",
        "src/types/standings.ts",
        "src/lib/validators/**",
      ],
    },
    // Shorter timeout since we never hit real DB
    testTimeout: 5000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
})
