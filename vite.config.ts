
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // mode === 'development' &&
    // componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Define process.env for browser compatibility
    'process.env': {},
    // Expose Vercel environment variables
    __APP_ENV__: JSON.stringify(process.env.VITE_VERCEL_ENV || '')
  },
  // Configuración de la ruta base para asegurar que los recursos estáticos se carguen correctamente
  // en entornos de vista previa y producción - SIEMPRE usar rutas relativas
  base: './',
  build: {
    // Asegurar que los assets usen rutas relativas
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Configurar nombres de archivos para mejor caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
}));
