import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'stats.html'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-zabely.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'Zabely',
        short_name: 'Zabely',
        description: 'Le Futur du E-commerce en Haïti',
        theme_color: '#f97316',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-data',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    })
  ],
  resolve: {
    alias: {
      'lodash.debounce': 'lodash/debounce'
    }
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['axios', 'react-use', 'lodash'],
          'vendor-forms': ['zod']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    sourcemap: false,
    cssCodeSplit: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@splinetool/react-spline', '@splinetool/runtime']
  },
  server: {
    hmr: {
      overlay: false
    },
    allowedHosts: ['zabely.loca.lt', 'localhost', '.loca.lt']
  }
})
