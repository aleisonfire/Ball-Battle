import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  root: 'src',
  server: {
    host: true
  },
  build: {
    target: 'esnext',
    outDir: '../dist'
  }
})