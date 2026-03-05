import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    
    // Gzip compression for all assets
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    }),
    
    // Brotli compression (superior compression ratio)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false,
    }),
    
    // Bundle analysis for performance monitoring
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    }),
    
    // PWA with comprehensive workbox configuration
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg'
      ],
      manifest: {
        name: 'Union Digitale',
        short_name: 'UD',
        description: 'La première plateforme e-commerce en Haïti',
        theme_color: '#003F87',
        background_color: '#f8fafc',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        lang: 'ht',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['shopping', 'business'],
        screenshots: [
          {
            src: 'screenshot-540x720.png',
            sizes: '540x720',
            type: 'image/png',
            form_factor: 'narrow'
          },
          {
            src: 'screenshot-1280x720.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          }
        ]
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,png,svg,ico,json,webp,woff,woff2}'
        ],
        globIgnores: [
          '**/node_modules/**/*',
          'dist/stats.html'
        ],
        
        // Critical caching strategies for performance
        runtimeCaching: [
          // API Endpoints - Products and Catalog
          {
            urlPattern: /^https:\/\/api\.uniondigitale\.ht\/api\/(products|catalog)/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-products-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              plugins: [
                {
                  handlerDidError: async () => {
                    // Return stale version if network fails
                    return new Response(JSON.stringify({ offline: true }), {
                      status: 200,
                      headers: { 'Content-Type': 'application/json' }
                    })
                  }
                }
              ]
            }
          },
          
          // Payment API - CRITICAL: Never cache!
          // Always fetch fresh to ensure latest payment status
          {
            urlPattern: /^https:\/\/api\.stripe\.com\/|^https:\/\/api\.uniondigitale\.ht\/api\/payments/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'payments-cache',
              networkTimeoutSeconds: 5
            }
          },
          
          // PayPal API - NetworkOnly to ensure transaction integrity
          {
            urlPattern: /^https:\/\/api\.paypal\.com\//i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'paypal-cache',
              networkTimeoutSeconds: 5
            }
          },
          
          // Firestore API - NetworkFirst for real-time data
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-data',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 3
            }
          },
          
          // Firebase Storage - NetworkFirst
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-storage',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Images - CacheFirst (static assets don't change frequently)
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              plugins: [
                {
                  handlerDidError: async () => {
                    return new Response(
                      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#f0f0f0" width="200" height="200"/></svg>',
                      {
                        headers: { 'Content-Type': 'image/svg+xml' },
                        status: 200
                      }
                    )
                  }
                }
              ]
            }
          },
          
          // Fonts - CacheFirst
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Google APIs - NetworkFirst
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-apis',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          },
          
          // Algolia Search - NetworkFirst
          {
            urlPattern: /^https:\/\/.*\.algolia\.net\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'algolia-search',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          }
        ],
        
        // Background sync for offline actions
        backgroundSync: {
          maxRetentionTime: 24 * 60 // 24 hours
        },
        
        // Skip waiting for immediate SW update
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  
  resolve: {
    alias: {
      'lodash.debounce': 'lodash/debounce'
    }
  },
  
  build: {
    // Target older Android devices common in Haiti
    target: 'es2015',
    
    // Use terser for best compression and control
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2, // Additional optimization pass
        pure_funcs: ['console.log', 'console.info']
      },
      mangle: true,
      format: {
        comments: false
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 300,
    
    // Rollup options for code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React and router
          'react-core': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          
          // Firebase suite (authentication and database)
          'firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
            'firebase-admin'
          ],
          
          // Payment processing - CRITICAL separate chunk
          'payments': [
            '@stripe/stripe-js',
            '@stripe/react-stripe-js',
            '@paypal/react-paypal-js'
          ],
          
          // UI animation and icons
          'ui': [
            'framer-motion',
            'lucide-react'
          ],
          
          // Charts and data visualization
          'charts': [
            'recharts'
          ],
          
          // HTTP client and utilities
          'utils': [
            'axios',
            'react-use',
            'dotenv'
          ],
          
          // Algolia search
          'search': [
            'algoliasearch',
            'react-instantsearch'
          ],
          
          // Maps (Leaflet)
          'maps': [
            'leaflet',
            'react-leaflet'
          ],
          
          // AI and external services
          'services': [
            '@google/generative-ai',
            'twilio',
            '@sentry/react',
            '@sentry/tracing'
          ],
          
          // Spline 3D graphics
          'graphics': [
            '@splinetool/react-spline',
            '@splinetool/runtime'
          ],
          
          // Mobile framework
          'mobile': [
            '@capacitor/core',
            '@capacitor/android',
            '@capacitor/ios'
          ]
        },
        
        // Named chunk files in assets/js/ for easy debugging
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/[name]-[hash].js`;
        },
        
        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js',
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|gif|svg|webp|ico/.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          } else if (ext === 'css') {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        }
      }
    },
    
    // Disable source maps in production for smaller bundle size
    sourcemap: false,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Report compressed size
    reportCompressedSize: true
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'axios'
    ],
    exclude: [
      '@splinetool/react-spline',
      '@splinetool/runtime'
    ]
  },
  
  // Server configuration for development
  server: {
    // Disable error overlay for performance
    hmr: {
      overlay: false
    },
    // Allow localtunnel and similar tunneling services
    allowedHosts: [
      'uniondigitale.loca.lt',
      'localhost',
      '127.0.0.1',
      '.loca.lt',
      'ngrok.io',
      '.ngrok.io'
    ]
  }
})
