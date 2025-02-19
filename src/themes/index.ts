export * from './base'
export * from './explorer'
export * from './assistant'
export * from './sidebar'

// Re-export everything as a convenience
export {
    baseTheme,
    sidebarBaseTheme,
    darkThemeVariables,
    createTheme,
} from './base'
export { explorerTheme, explorerThemeVariables } from './explorer'
export { assistantTheme, assistantThemeVariables } from './assistant'
export { sidebarTheme, sidebarThemeVariables } from './sidebar'

// Export a complete theme that combines all base themes
import { baseTheme, sidebarBaseTheme, createTheme } from './base'
import { explorerTheme } from './explorer'
import { assistantTheme } from './assistant'
import type { Extension } from '@codemirror/state'

export function createCompleteTheme(options: {
    dark?: boolean
    variables?: Record<string, string>
}): Extension[] {
    const { dark = true, variables = {} } = options

    return [
        // Base themes
        baseTheme,
        sidebarBaseTheme,

        // Extension themes
        explorerTheme.theme,
        dark && explorerTheme.darkTheme,
        !dark && explorerTheme.lightTheme,

        // Assistant theme
        assistantTheme.theme,
        dark && assistantTheme.darkTheme,
        !dark && assistantTheme.lightTheme,

        // User variables
        createTheme(variables),
    ].filter(Boolean) as Extension[]
}
