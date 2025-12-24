import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    
    define: {
      // Polyfill process.env.API_KEY for the Gemini SDK
      // This maps the VITE_GEMINI_API_KEY from your .env file to process.env.API_KEY
      // Fallback to 'placeholder_key' to prevent runtime crashes if key is missing
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GEMINI_API_KEY || 'placeholder_key'),
    },
    
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'charts': ['recharts'],
            'markdown': ['react-markdown'],
          }
        }
      }
    }
  };
});