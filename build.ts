import { $ } from 'bun'
import { config } from './src/config'

await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    target: config.BUILD_TARGET,
})

console.log('JavaScript build complete.')

const { stdout, stderr } =
    await $`tsc --emitDeclarationOnly --declaration --project tsconfig.types.json --outDir ./dist`

if (stderr.toString().length) {
    console.error('Type generation errors:', stderr.toString())
} else {
    console.log('Types generated:', stdout.toString())
}
