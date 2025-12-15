// frontend/vite.config.ts - OPTIMIZED BUILD CONFIGURATION
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },

    // ============= PERFORMANCE OPTIMIZATIONS =============
    build: {
        // Output directory
        outDir: 'dist',

        // Generate sourcemaps for production debugging (disable for faster builds)
        sourcemap: false,

        // Minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs in production
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
            },
        },

        // Chunk size warnings
        chunkSizeWarningLimit: 1000,

        // Code splitting optimization
        rollupOptions: {
            output: {
                // Manual chunk splitting for better caching
                manualChunks: {
                    // Vendor chunks
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'ui-vendor': ['lucide-react', 'recharts'],

                    // Feature-based chunks
                    'admin': [
                        './src/pages/admin/AdminDashboard.tsx',
                        './src/pages/admin/AllPermits.tsx',
                        './src/pages/admin/UserManagement.tsx',
                    ],
                    'supervisor': [
                        './src/components/supervisor/CreatePTW.tsx',
                        './src/components/supervisor/SupervisorDashboard.tsx',
                    ],
                    'approver': [
                        './src/components/approver/ApprovalDashboard.tsx',
                        './src/components/approver/ExtensionApprovalDashboard.tsx',
                    ],
                },

                // Asset file names
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info[info.length - 1];
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                        return `assets/images/[name]-[hash][extname]`;
                    } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
                        return `assets/fonts/[name]-[hash][extname]`;
                    }
                    return `assets/[name]-[hash][extname]`;
                },

                // Chunk file names
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
            },
        },

        // CSS code splitting
        cssCodeSplit: true,

        // Optimize dependencies
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },

    // ============= DEV SERVER OPTIMIZATIONS =============
    server: {
        port: 3000,
        strictPort: true,

        // HMR optimization
        hmr: {
            overlay: true,
        },

        // Proxy API requests to backend
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },

    // ============= DEPENDENCY OPTIMIZATION =============
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'lucide-react',
            'recharts',
        ],
        exclude: [],
    },

    // ============= PREVIEW SERVER =============
    preview: {
        port: 4173,
        strictPort: true,
    },
});
