import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = env.VITE_BASE_PATH || '/';
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) {
    throw new Error('VITE_BASE_PATH must be / or a slash-delimited relative repository path.');
  }
  return {
    plugins: [react()],
    base,
    build: { outDir: 'dist', sourcemap: false },
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
  };
});
