import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// El paquete compartido se compila a CommonJS (lo consume NestJS); aquí Vite
// lee su fuente TypeScript directamente para tener ESM + tipos sin doble build.
const sharedSrc = fileURLToPath(
  new URL('../../servidor/shared/src/index.ts', import.meta.url),
);

// Proxy en desarrollo: la API y las fotos viven en :3000, el WS en /monitoreo.
// En producción este papel lo cumple Nginx (ver Dockerfile).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@club-campina/shared-types': sharedSrc },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/monitoreo': { target: 'http://localhost:3000', ws: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
