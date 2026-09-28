import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // Send /api requests to the Day 13 server, so the browser sees one origin (no CORS setup needed)
    proxy: { "/api": "http://localhost:3000" },
  },
});
