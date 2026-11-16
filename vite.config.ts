import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

const MODULE_CONFIGS = [
  { id: 'sala', name: 'salaApp', defaultPort: 5174 },
  { id: 'menu', name: 'menuApp', defaultPort: 5173 },
  { id: 'inventario', name: 'inventarioApp', defaultPort: 5176 },
  { id: 'ordenes', name: 'ordenesApp', defaultPort: 5177 },
  { id: 'cocina', name: 'cocinaApp', defaultPort: 5179 },
  { id: 'caja', name: 'cajaApp', defaultPort: 5178 },
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const gatewayUrl = env.VITE_GATEWAY_URL || 'http://localhost:8000';
  const remotes: Record<string, string> = {};
  const proxy: Record<string, { target: string; changeOrigin: boolean; rewrite: (p: string) => string }> = {};

  for (const m of MODULE_CONFIGS) {
    const target =
      env[`VITE_REMOTE_${m.id.toUpperCase()}_TARGET`] ||
      `http://localhost:${m.defaultPort}`;
    const customUrl = env[`VITE_REMOTE_${m.id.toUpperCase()}_URL`];

    remotes[m.name] = customUrl || `http://localhost:3000/remote/${m.id}/assets/remoteEntry.js`;
    proxy[`/remote/${m.id}`] = {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(new RegExp(`^/remote/${m.id}`), ''),
    };
  }

  return {
    plugins: [
      {
        name: 'fmat-remote-gateway-rewrite',
        configureServer(server) {
          server.middlewares.use(async (rawReq, rawRes, next) => {
            const req = rawReq as { url?: string };
            const res = rawRes as {
              statusCode: number;
              setHeader: (name: string, value: string) => void;
              end: (body: string | Uint8Array) => void;
            };
            if (!req.url?.startsWith('/remote/')) return next();
            const cleanUrl = req.url.split('?')[0];
            const match = cleanUrl.match(/^\/remote\/([^/]+)(\/.*)$/);
            if (!match) return next();
            const [, moduleId, restPath] = match;
            const mod = MODULE_CONFIGS.find((m) => m.id === moduleId);
            if (!mod) return next();
            const liveEnv = loadEnv(mode, '.', '');
            const target =
              liveEnv[`VITE_REMOTE_${mod.id.toUpperCase()}_TARGET`] ||
              `http://localhost:${mod.defaultPort}`;
            try {
              const upstream = await fetch(`${target}${restPath}`, {
                signal: AbortSignal.timeout(4000),
              });
              res.statusCode = upstream.status;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cache-Control', 'no-store');
              const contentType = upstream.headers.get('content-type') || '';
              if (restPath.endsWith('.js') || contentType.includes('javascript')) {
                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                const code = await upstream.text();
                const patched = code.replace(
                  /http:\/\/localhost:808[0-5]/g,
                  gatewayUrl,
                );
                res.end(patched);
              } else {
                if (contentType) res.setHeader('Content-Type', contentType);
                const buf = new Uint8Array(await upstream.arrayBuffer());
                res.end(buf);
              }
            } catch (err) {
              res.statusCode = 502;
              res.end(`Bad Gateway: ${err instanceof Error ? err.message : String(err)}`);
            }
          });
        },
      },
      react(),
      federation({
        name: 'auth_shell',
        remotes,
        shared: ['react', 'react-dom'],
      }),
    ],
    server: {
      port: 3000,
      host: true,
      proxy,
    },
    optimizeDeps: {
      exclude: ['@playwright/test', 'playwright', 'playwright-core'],
    },
    build: {
      target: 'esnext',
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      exclude: ['e2e/**', 'node_modules/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/main.tsx',
          'src/vite-env.d.ts',
          'src/setupTests.ts',
          'src/types/**',
          'src/components/ui/Icons.tsx',
          'src/components/layout/ModulePlaceholderView.tsx',
          'src/components/auth/RegisterRestaurantForm.tsx',
          'src/**/*.test.{ts,tsx}',
        ],
      },
    },
  };
});
