import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const GEMINI_API_KEY = 'AIzaSyAUYGmg8EFo8lgMRX3qPSqPFf8VfykLfBw';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          // Fix: Replace __dirname with './' to avoid undefined errors in ES module contexts.
          '@': path.resolve('./'),
        }
      }
    };
});