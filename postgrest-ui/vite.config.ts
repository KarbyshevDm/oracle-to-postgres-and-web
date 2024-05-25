import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


// https://vitejs.dev/config/
export default defineConfig(
    {
    
    plugins: [react()],
    define: {
        VITE_BACKEND_URL: process.env.VITE_BACKEND_URL,
      },
    preview:{
        port: 8080,
        strictPort:true,
    },
    server: {
        host: true,
        strictPort:true,
        port:8080,
    },
    base: './',
});
