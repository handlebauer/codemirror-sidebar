// src/index.ts (Main entry point for your extension)
import { keymap } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { createSidebar, type SidebarOptions } from './sidebar'
import { fileExplorer } from './explorer'
import { javascript } from '@codemirror/lang-javascript' // Or a default language
import { type Extension } from '@codemirror/state'

interface SidebarExtensionOptions {
    language?: Extension // Allow overriding the language
    sidebarOptions?: SidebarOptions // Allow overriding sidebar options
}

export function sidebarExtension(
    options: SidebarExtensionOptions = {},
): Extension[] {
    const { language = javascript({ typescript: true }), sidebarOptions } =
        options

    const extensions: Extension[] = [
        keymap.of(defaultKeymap),
        ...fileExplorer,
        language, // Add the language support
    ]

    // Create the sidebar with options if provided
    if (sidebarOptions) {
        extensions.push(
            ...createSidebar({
                ...sidebarOptions,
                id: sidebarOptions.id || 'file-explorer',
            }),
        )
    }

    return extensions
}

// Example of creating a second sidebar (e.g., for an AI assistant)
export function createAISidebar(
    options: Partial<SidebarOptions> = {},
): Extension[] {
    return createSidebar({
        dock: 'right',
        width: '300px',
        id: 'ai-assistant',
        overlay: true, // AI sidebar defaults to overlay mode
        ...options,
    })
}
