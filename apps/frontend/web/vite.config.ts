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
<<<<<<< HEAD
  plugins: [react()],
  base: "/", // 👈 IMPORTANT
=======
  plugins: [react(), tailwindcss()],
>>>>>>> 0587d4b03d221edf42b3dd2d0a467d54f9589ebb
});