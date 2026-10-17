import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Plugin tự động map các import đuôi .js sang .jsx khi file vật lý là .jsx
function resolveJsToJsx() {
  return {
    name: 'resolve-js-to-jsx',
    resolveId(source, importer) {
      if (importer && source.startsWith('.') && source.endsWith('.js')) {
        const dir = path.dirname(importer);
        const resolvedPath = path.resolve(dir, source);
        // Nếu file .js thực tế đã tồn tại (ví dụ api.js, dbStorage.js), giữ nguyên
        if (fs.existsSync(resolvedPath)) {
          return null;
        }
        // Nếu file .jsx tồn tại thay thế, ánh xạ trực tiếp sang file .jsx
        const jsxPath = resolvedPath.replace(/\.js$/, '.jsx');
        if (fs.existsSync(jsxPath)) {
          return jsxPath;
        }
      }
      return null;
    }
  };
}

// Plugin tự động import React nếu file có sử dụng React mà chưa import
function autoImportReact() {
  return {
    name: 'auto-import-react',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules')) return null;
      if (/\.(jsx|js)$/.test(id) && /\bReact\b/.test(code)) {
        if (!code.includes("from 'react'") && !code.includes('from "react"')) {
          return {
            code: `import React from 'react';\n` + code,
            map: null
          };
        }
      }
      return null;
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.SCMS_API_PROXY_TARGET || 'http://localhost:3003';

  return {
    plugins: [
      autoImportReact(),
      resolveJsToJsx(),
      react()
    ],
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
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              return 'vendor-libs';
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    }
  };
});
