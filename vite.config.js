import { defineConfig } from 'vite';
export default defineConfig({ base: './', build: { outDir: 'dist', target: 'es2020' }, server: { port: 5173, host: '127.0.0.1' } });
