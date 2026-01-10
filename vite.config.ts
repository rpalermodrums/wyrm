import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'game-core': ['./src/core/GameLoop.ts', './src/core/Canvas.ts'],
          'game-ecs': ['./src/ecs/Entity.ts', './src/ecs/World.ts'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
