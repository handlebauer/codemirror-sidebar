import { z } from 'zod'
import { name, version } from '../../package.json'

const envSchema = z.enum(['development', 'test', 'production'])
const targetSchema = z.enum(['browser', 'bun', 'node'])

const appConfigSchema = z.object({
    PACKAGE_NAME: z.string().default(name),
    VERSION: z
        .string()
        .regex(
            /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
            { message: 'Version must be a valid semver string' },
        )
        .default(version),
    NODE_ENV: envSchema.default('development'),
    BUILD_TARGET: targetSchema.default('bun'),
})

type AppConfig = z.infer<typeof appConfigSchema>

function validateAppConfig(env: NodeJS.ProcessEnv): AppConfig {
    try {
        return appConfigSchema.parse(env)
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Configuration error:')
            error.errors.forEach(err => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`)
            })
            process.exit(1)
        }
        throw error
    }
}

export const config: AppConfig = validateAppConfig(process.env)
