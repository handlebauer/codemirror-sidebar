import { $ } from 'bun'
import { config } from './src/config'
import packageJson from './package.json' assert { type: 'json' }

await Bun.build({
    entrypoints: [
        './src/index.ts',
        './src/explorer/index.ts',
        './src/assistant/index.ts',
        './src/hooks/index.ts',
    ],
    external: [
        ...Object.keys(packageJson.dependencies),
        ...Object.keys(packageJson.peerDependencies),
    ],
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
