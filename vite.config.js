import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/stack-product/',
  build: {
    rollupOptions: {
      input: {
        main:    resolve(__dirname, 'index.html'),
        builder: resolve(__dirname, 'stack-builder.html'),
      },
    },
  },
})
