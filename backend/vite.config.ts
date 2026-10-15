import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({ root: 'web', plugins: [vue()], build: { outDir: '../web-dist', emptyOutDir: true }, server: { proxy: { '/api': 'http://localhost:3000', '/uploads': 'http://localhost:3000' } } });
