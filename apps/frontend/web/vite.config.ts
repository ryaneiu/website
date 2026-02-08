import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/*
******************************************************
*  WARNING:
*
*  DO NOT MODIFY THIS FILE UNLESS YOU KNOW EXACTLY
*  WHAT YOU ARE DOING.
*
*  Changes here affect:
*   - Build output
*   - Asset paths
*   - Dev server behavior
*   - Deployment configuration
*
*  Incorrect edits WILL break the frontend.
*
*  If you need environment-specific behavior, use:
*    - .env files
*    - vite.config.local.ts
* 
*  To serve files, look in dist/.
*
******************************************************
*/

export default defineConfig({
  plugins: [react(), tailwindcss()],
});