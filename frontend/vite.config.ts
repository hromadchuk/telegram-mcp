import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type ProxyOptions } from 'vite';

const backendProxy: ProxyOptions = {
  target: 'http://127.0.0.1:3000',
};

export default defineConfig({
  envDir: path.resolve(import.meta.dirname, '..'),
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@mtcute/wasm'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/.well-known': backendProxy,
      '/oauth': backendProxy,
      '/mcp': backendProxy,
      '/api': {
        ...backendProxy,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, ''),
      },
    },
  },
});
