import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import process from "process";
import version from "vite-plugin-package-version";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /** Env */
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      /** Plugins */
      version(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.*"],
          globIgnores: ["**/screenshot-*.jpg", "**/social-preview.png"],
          maximumFileSizeToCacheInBytes: 5 * 1024 ** 2,
        },
        manifest: {
          name: "Packer",
          short_name: "Packer",
          description: "Batch BSC Transactions with Built-in Hash Maker.",
          theme_color: "#0a0a0a",
          background_color: "#0a0a0a",
          id: "/",
          icons: [
            {
              src: "pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          screenshots: [
            {
              src: "screenshot-mobile-1.jpg",
              sizes: "1080x1920",
              type: "image/jpg",
            },
            {
              src: "screenshot-mobile-2.jpg",
              sizes: "1080x1920",
              type: "image/jpg",
            },
            {
              src: "screenshot-mobile-3.jpg",
              sizes: "1080x1920",
              type: "image/jpg",
            },
            {
              src: "screenshot-mobile-4.jpg",
              sizes: "1080x1920",
              type: "image/jpg",
            },
            {
              src: "screenshot-desktop-wide.jpg",
              sizes: "1920x1080",
              type: "image/jpg",
              form_factor: "wide",
            },
          ],
        },
      }),
      ViteEjsPlugin(env),
      tailwindcss(),
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
    ],
  };
});
