import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  root: 'src',
  base: '/Ball-Battle/',
  server: {
    host: true
  },
  build: {
    target: 'esnext',
    outDir: '../dist'
  }
})