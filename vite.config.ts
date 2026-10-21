import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'auth_shell',
      remotes: {
        salaApp: 'http://localhost:5174/assets/remoteEntry.js',
        menuApp: 'http://localhost:5175/assets/remoteEntry.js',
        inventarioApp: 'http://localhost:5176/assets/remoteEntry.js',
        ordenesApp: 'http://localhost:5177/assets/remoteEntry.js',
        cajaApp: 'http://localhost:5178/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
  },
  // @ts-expect-error Vitest config is extended on Vite UserConfig
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
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
});
