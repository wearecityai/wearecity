
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Define process.env for browser compatibility
    'process.env': {
      API_KEY: JSON.stringify('AIzaSyBHL5n8B2vCcQIZKVVLE2zVBgS4aYclt7g'),
      GEMINI_API_KEY: JSON.stringify('AIzaSyBHL5n8B2vCcQIZKVVLE2zVBgS4aYclt7g'),
    }
  },
}));
