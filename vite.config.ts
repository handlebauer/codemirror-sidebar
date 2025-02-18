import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 3000,
        open: '/examples/vanilla/',
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            input: {
                index: 'index.html',
                vanilla: 'examples/vanilla/index.html',
            },
        },
    },
})
