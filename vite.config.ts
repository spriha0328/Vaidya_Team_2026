import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // We cast process to any to avoid TypeScript errors if types/node is missing
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // This injects the API key from your shell or .env file into the code where `process.env.API_KEY` is used
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    server: {
      port: 8080,
    }
  };
});