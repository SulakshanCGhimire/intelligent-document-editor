import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // CRITICAL: Forces Vite to merge duplicate packages caused by --legacy-peer-deps
    dedupe: [
      'y-prosemirror', 
      '@tiptap/pm', 
      'prosemirror-state', 
      'prosemirror-view',
      'prosemirror-model',
      'prosemirror-transform'
    ]
  }
})