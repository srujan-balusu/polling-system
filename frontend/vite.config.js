// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",       // ensure this matches your deploy path
  plugins: [react()],
});
