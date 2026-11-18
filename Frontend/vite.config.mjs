import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

const SPLASH_CSS = fileURLToPath(new URL('./src/widgets/app-splash/ui/splash.css', import.meta.url));

// The launch splash must be styled in the very first paint, before any JS or CSS bundle arrives,
// so its stylesheet is inlined into index.html. React's splash reuses the same rules.
function inlineSplashCss() {
  return {
    name: 'scms-inline-splash-css',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!html.includes('<!-- osa-splash-css -->')) return html;
        const css = readFileSync(SPLASH_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n/g, '\n');
        return html.replace('<!-- osa-splash-css -->', `<style>${css}</style>`);
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.replace(/\\/g, '/').endsWith('app-splash/ui/splash.css')) server.ws.send({ type: 'full-reload' });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.SCMS_API_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [react(), inlineSplashCss()],
    server: {
      port: 3004,
      host: 'localhost',
      // Browser test profiles contain locked Windows files and must stay outside the source watcher.
      watch: { ignored: ['**/tmp/**', '**/.validation/**'] },
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          configure(proxy) {
            // A stopped API is a gateway failure, so callers need an actionable JSON response.
            proxy.on('error', (_error, _request, response) => {
              if (!response?.writeHead || response.headersSent || response.writableEnded) return;
              response.writeHead(503, { 'Content-Type': 'application/problem+json; charset=utf-8' });
              response.end(JSON.stringify({
                status: 503,
                code: 'API_UNAVAILABLE',
                title: 'Backend unavailable',
                message: `Không kết nối được backend tại ${apiTarget}.`,
                proposedHandling: 'Khởi động ASP.NET Core API và kiểm tra SCMS_API_PROXY_TARGET trong cấu hình FE.'
              }));
            });
          }
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true
        }
      },
      open: false
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      // Let Rollup own the chunk graph. Splitting every dependency into either
      // vendor-react or vendor-libs creates a circular chunk when libraries
      // such as motion/react import React, which can execute createContext
      // before the React chunk has initialized in a production build.
      chunkSizeWarningLimit: 1000,
      // Second page: the standalone campus map keeps its public URL /3d-campus.html.
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          campus: fileURLToPath(new URL('./3d-campus.html', import.meta.url))
        }
      }
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    }
  };
});
