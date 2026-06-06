import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // During development, resolve the SDK workspace package directly from its
            // TypeScript source so there is no need to pre-build the SDK first.
            "@monad-session-arena/sdk": path.resolve(__dirname, "../../packages/sdk/src/index.ts"),
        },
    },
    server: {
        port: 5173,
    },
});
