import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 3000,
        open: '/demo/',
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            input: {
                index: 'index.html',
                demo: 'demo/index.html',
            },
        },
    },
})
