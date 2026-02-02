import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simplified config for debugging build issues
export default defineConfig({
    plugins: [
        react(),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
                }
            }
        }
    },
    optimizeDeps: {
        exclude: ['@splinetool/react-spline', '@splinetool/runtime']
    }
})
