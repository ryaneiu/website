import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createHtmlPlugin } from "vite-plugin-html";

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

// Please READ  the warning above!!!
// Please learn to have patience to READ!!
// Do NOt Replace this with AI GENERATED trash
// And side note: your AI GENERATED FIXES WERE NOT WORKING
// Plus you didn't finish resolving the merge conflict before pushing
export default defineConfig({
    plugins: [react(), tailwindcss(), createHtmlPlugin({
        minify: {
            collapseWhitespace: true,
            removeComments: true,
            removeAttributeQuotes: true,
            minifyJS: true,   // minifies core script
            minifyCSS: true,
        },
    }),],
    optimizeDeps: {
        exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
    },
    assetsInclude: ["**/*.wasm"],
    build: {
        rollupOptions: {
            external: ["@jsquash/avif"], // fix build
            treeshake: {
                moduleSideEffects: false,
                propertyReadSideEffects: false,
                unknownGlobalSideEffects: false
            },
            output: {
                chunkFileNames: "assets/chunk-[hash].js",
                entryFileNames: "assets/[hash].js",
                assetFileNames: "assets/[hash][extname]",
            },
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: Infinity,              // stronger optimization
                dead_code: true,
                unused: true,
                conditionals: true,
                comparisons: true,
                evaluate: true,
                booleans: true,
                loops: true,

                if_return: true,
                join_vars: true,
                reduce_vars: true,
                collapse_vars: true,

                sequences: true,
                side_effects: true,
                drop_debugger: true,
                arguments: true
            },
            mangle: {
                toplevel: true,         // safe size win
            },
            format: {
                comments: false
            }
        }
    }
    // DO NOT REPLACE THIS LINE WITH AN
    // AI GENERATED "FIX" THAT DOES NOT WORK!!! 
    // DO NOT MODIFY FRONTEND TO WORK WITH BACKEND
    // MODIFY BACKEND TO MAKE IT WORK WITH FRONTEND
});
