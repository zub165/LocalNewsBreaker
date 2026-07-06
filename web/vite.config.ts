import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_BASE_URL || 'https://citizen-api.mywaitime.com';

  return {
    plugins: [react()],
    base: mode === 'production' ? '/LocalNewsBreaker/app/' : '/',
    build: {
      outDir: '../website/app',
      emptyOutDir: true,
    },
    server: {
      port: 5180,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
