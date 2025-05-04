import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig(({ mode }) => {
  // load env file from root directory
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  
  return {
    plugins: [react(), svgr()],
    root: path.resolve(__dirname, 'client'),
    envDir: path.resolve(__dirname),
    base: isProduction ? '/assets/' : '/',
    build: {
      outDir: path.resolve(__dirname, 'client/dist'),
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      minify: true,
      manifest: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom']
          },
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
              return `fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js'
        }
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || "http://localhost:3000",
          changeOrigin: true,
        },
        '/socket.io': {
          target: env.VITE_API_BASE_URL || "http://localhost:3000",
          ws: true,
          changeOrigin: true,
        },
      }
    }
  };
});