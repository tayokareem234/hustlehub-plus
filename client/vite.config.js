import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],

    server: {
        proxy: {
            "/api": {
                target: "https://localhost:3000",
                changeOrigin: true,
                secure: false,
            },
        },
    },

    test: {
        environment: "jsdom",
        setupFiles: "./src/setupTests.js",
        globals: true,
        css: true,
    },
});