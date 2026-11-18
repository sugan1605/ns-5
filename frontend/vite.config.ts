import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "@/x" means "src/x". Must match "paths" in tsconfig.app.json.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
