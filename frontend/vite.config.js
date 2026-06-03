import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: http: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http: https: ws: wss:; font-src 'self' data:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    open: true,
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
