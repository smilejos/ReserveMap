import react from '@vitejs/plugin-react'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-reservemap-data',
      async writeBundle() {
        const outputDirectory = path.join(projectRoot, 'dist', 'data')
        await mkdir(outputDirectory, { recursive: true })
        await Promise.all(
          ['definitions.json', 'places.json'].map((fileName) =>
            copyFile(
              path.join(projectRoot, 'data', fileName),
              path.join(outputDirectory, fileName),
            ),
          ),
        )
      },
    },
  ],
  base: process.env.BASE_PATH || '/',
  build: {
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
