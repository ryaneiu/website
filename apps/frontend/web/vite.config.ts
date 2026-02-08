import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/static/",   // 👈 THIS IS THE KEY
  build: {
    outDir: "dist",
    assetsDir: "",    // optional but cleaner
  },
});