import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'det-vocab-builder' with your EXACT GitHub repository name
export default defineConfig({
  plugins: [react()],
  base: '/det-vocab-builder/', 
})