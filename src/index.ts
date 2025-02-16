// src/index.ts (Main entry point for your extension)
import { keymap, EditorView } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import {
    createSidebar,
    type SidebarOptions,
    toggleSidebarCommand,
    toggleSidebarEffect,
} from './sidebar'
import { fileExplorer } from './explorer'
import { javascript } from '@codemirror/lang-javascript' // Or a default language
import { type Extension } from '@codemirror/state'

interface SidebarExtensionOptions {
    language?: Extension // Allow overriding the language
    sidebarOptions?: SidebarOptions // Allow overriding sidebar options
    toggleKeymaps?: { mac?: string; win?: string } // Optional keymap configuration
}

export function sidebarExtension(
    options: SidebarExtensionOptions = {},
): Extension[] {
    const {
        language = javascript({ typescript: true }),
        sidebarOptions,
        toggleKeymaps,
    } = options

    const extensions: Extension[] = [
        keymap.of(defaultKeymap),
        ...fileExplorer,
        language, // Add the language support
    ]

    // Create the sidebar with options if provided
    if (sidebarOptions) {
        const sidebarId = sidebarOptions.id || 'file-explorer'
        extensions.push(
            ...createSidebar({
                ...sidebarOptions,
                id: sidebarId,
            }),
        )

        // Add keymap if configured
        if (toggleKeymaps) {
            const keymapBindings = []
            if (toggleKeymaps.mac) {
                keymapBindings.push({
                    key: toggleKeymaps.mac,
                    run: (view: EditorView) =>
                        toggleSidebarCommand(view, sidebarId),
                })
            }
            if (toggleKeymaps.win) {
                keymapBindings.push({
                    key: toggleKeymaps.win,
                    run: (view: EditorView) =>
                        toggleSidebarCommand(view, sidebarId),
                })
            }
            if (keymapBindings.length > 0) {
                extensions.push(keymap.of(keymapBindings))
            }
        }
    }

    return extensions
}

// Example of creating a second sidebar (e.g., for an AI assistant)
export interface AISidebarOptions extends Partial<SidebarOptions> {
    toggleKeymaps?: { mac?: string; win?: string }
}

export function createAISidebar(options: AISidebarOptions = {}): Extension[] {
    const { toggleKeymaps, ...sidebarOptions } = options
    const extensions = createSidebar({
        dock: 'right',
        width: '300px',
        id: 'ai-assistant',
        overlay: true, // AI sidebar defaults to overlay mode
        ...sidebarOptions,
    })

    // Add keymap if configured
    if (toggleKeymaps) {
        const keymapBindings = []
        if (toggleKeymaps.mac) {
            keymapBindings.push({
                key: toggleKeymaps.mac,
                run: (view: EditorView) =>
                    toggleSidebarCommand(view, 'ai-assistant'),
            })
        }
        if (toggleKeymaps.win) {
            keymapBindings.push({
                key: toggleKeymaps.win,
                run: (view: EditorView) =>
                    toggleSidebarCommand(view, 'ai-assistant'),
            })
        }
        if (keymapBindings.length > 0) {
            extensions.push(keymap.of(keymapBindings))
        }
    }

    return extensions
}

export { toggleSidebarEffect }
