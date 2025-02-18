// src/index.ts (Main entry point for your extension)
import { keymap, EditorView } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import {
    createSidebar,
    type SidebarOptions,
    type SidebarPanelSpec,
    type DockPosition,
    toggleSidebarCommand,
    toggleSidebarEffect,
    sidebarPanel,
    updateSidebarOptionsEffect,
    setActivePanelEffect,
} from './sidebar'
import { fileExplorer } from './explorer/index'
import { javascript } from '@codemirror/lang-javascript' // Or a default language
import { type Extension } from '@codemirror/state'
import { assistant } from './assistant'

interface SidebarExtensionOptions {
    language?: Extension // Allow overriding the language
    sidebarOptions?: SidebarOptions // Allow overriding sidebar options
    toggleKeymaps?: { mac?: string; win?: string } // Optional keymap configuration
}

// Global keymap handler for sidebars
const globalKeymapHandlers = new Map<string, (view: EditorView) => boolean>()

function handleGlobalKeyEvent(event: KeyboardEvent) {
    const isMac = /Mac/.test(navigator.platform)
    const modKey = isMac ? event.metaKey : event.ctrlKey
    if (!modKey) return

    const key = `${isMac ? 'Cmd' : 'Ctrl'}-${event.key.toLowerCase()}`
    const handler = globalKeymapHandlers.get(key)
    if (handler) {
        // Find the EditorView instance
        const editorElement = document.querySelector(
            '.cm-editor',
        ) as HTMLElement
        if (editorElement) {
            const view = EditorView.findFromDOM(editorElement)
            if (view) {
                event.preventDefault()
                handler(view)
            }
        }
    }
}

// Initialize global keymap listener
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeyEvent)
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

        // Register global keymap handlers if configured
        if (toggleKeymaps) {
            if (toggleKeymaps.mac) {
                globalKeymapHandlers.set(
                    toggleKeymaps.mac,
                    (view: EditorView) => toggleSidebarCommand(view, sidebarId),
                )
            }
            if (toggleKeymaps.win) {
                globalKeymapHandlers.set(
                    toggleKeymaps.win,
                    (view: EditorView) => toggleSidebarCommand(view, sidebarId),
                )
            }
        }
    }

    return extensions
}

// Example of creating a second sidebar (e.g., for an AI assistant)
interface AISidebarOptions extends Omit<SidebarOptions, 'id' | 'dock'> {
    toggleKeymaps?: { mac?: string; win?: string }
}

export function createAISidebar(options: AISidebarOptions = {}): Extension[] {
    const { toggleKeymaps, ...sidebarOptions } = options
    const extensions = [
        ...createSidebar({
            dock: 'right',
            width: '300px',
            id: 'ai-assistant',
            overlay: true, // AI sidebar defaults to overlay mode
            ...sidebarOptions,
        }),
        ...assistant, // Add the assistant extension
    ]

    // Register global keymap handlers if configured
    if (toggleKeymaps) {
        if (toggleKeymaps.mac) {
            globalKeymapHandlers.set(toggleKeymaps.mac, (view: EditorView) =>
                toggleSidebarCommand(view, 'ai-assistant'),
            )
        }
        if (toggleKeymaps.win) {
            globalKeymapHandlers.set(toggleKeymaps.win, (view: EditorView) =>
                toggleSidebarCommand(view, 'ai-assistant'),
            )
        }
    }

    return extensions
}

export type { SidebarPanelSpec, SidebarOptions, DockPosition, AISidebarOptions }
export {
    toggleSidebarCommand,
    toggleSidebarEffect,
    sidebarPanel,
    updateSidebarOptionsEffect,
    setActivePanelEffect,
}
