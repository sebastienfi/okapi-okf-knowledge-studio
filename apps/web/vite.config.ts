import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

const publicOut = fileURLToPath(new URL('../../packages/cli/dist/public', import.meta.url));
const devApiTarget = process.env.OKAPI_API ?? 'http://127.0.0.1:4317';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: devApiTarget, changeOrigin: true },
    },
  },
  build: {
    outDir: publicOut,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
});
