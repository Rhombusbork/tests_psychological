import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/tests_psychological/',
  plugins: [react()],
  test: { environment: 'node' },
} as never);
