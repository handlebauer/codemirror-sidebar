import { config } from '~/config'

await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    target: config.BUILD_TARGET,
})
