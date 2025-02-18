import { type Extension } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { type DockPosition } from '../sidebar'
import { createSidebar, sidebarPanel, toggleSidebarCommand } from '../sidebar'
import {
    fileExplorerState,
    fileExplorerPanelSpec,
    type File,
    // Internal implementation details, not exported to userland
    fileExplorerPlugin,
    languageCompartment,
    selectFileEffect,
} from './state'

// Global keymap handler for sidebars
const globalKeymapHandlers = new Map<string, (view: EditorView) => boolean>()

// Initialize global keymap listener
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', event => {
        const isMac = /Mac/.test(navigator.platform)
        const modKey = isMac ? event.metaKey : event.ctrlKey
        if (!modKey) return

        const key = `${isMac ? 'Cmd' : 'Ctrl'}-${event.key.toLowerCase()}`
        const handler = globalKeymapHandlers.get(key)
        if (handler) {
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
    })
}

export interface ExplorerOptions {
    /**
     * Which side to dock the explorer on
     * @default 'left'
     */
    dock?: DockPosition
    /**
     * Width of the explorer panel
     * @default '250px'
     */
    width?: string
    /**
     * Keyboard shortcut to toggle the explorer
     * Can be a string for same shortcut on all platforms
     * or an object for platform-specific shortcuts
     * @example 'Cmd-e' or { mac: 'Cmd-e', win: 'Ctrl-e' }
     */
    keymap?: string | { mac: string; win: string }
    /**
     * Whether to show the explorer as an overlay
     * @default false
     */
    overlay?: boolean
    /**
     * Background color of the explorer panel
     * @default '#2c313a'
     */
    backgroundColor?: string
    /**
     * Whether the explorer should be open by default
     * @default false
     */
    initiallyOpen?: boolean
    /**
     * Callback function that is called when a file is selected
     * @param filename The name/path of the selected file
     * @param view The current editor view
     */
    onFileSelect?: (filename: string, view: EditorView) => void
}

// Create a ViewPlugin to handle file selection callbacks
function createFileSelectPlugin(
    onFileSelect?: (filename: string, view: EditorView) => void,
) {
    return ViewPlugin.fromClass(
        class {
            update(update: ViewUpdate) {
                if (!onFileSelect) return

                for (const effect of update.transactions.flatMap(
                    tr => tr.effects,
                )) {
                    if (effect.is(selectFileEffect)) {
                        onFileSelect(effect.value, update.view)
                    }
                }
            }
        },
    )
}

/**
 * Creates a file explorer extension for CodeMirror
 */
export function explorer(options: ExplorerOptions = {}): Extension[] {
    const {
        dock = 'left',
        width = '250px',
        overlay = false,
        backgroundColor = '#2c313a',
        keymap,
        initiallyOpen = false,
        onFileSelect,
    } = options

    const sidebarOptions = {
        id: 'file-explorer',
        dock,
        width,
        overlay,
        backgroundColor,
        initiallyOpen,
        initialPanelId: 'file-explorer',
    }

    // Register keymap handlers if configured
    if (keymap) {
        if (typeof keymap === 'string') {
            globalKeymapHandlers.set(keymap, view =>
                toggleSidebarCommand(view, 'file-explorer'),
            )
        } else {
            if (keymap.mac) {
                globalKeymapHandlers.set(keymap.mac, view =>
                    toggleSidebarCommand(view, 'file-explorer'),
                )
            }
            if (keymap.win) {
                globalKeymapHandlers.set(keymap.win, view =>
                    toggleSidebarCommand(view, 'file-explorer'),
                )
            }
        }
    }

    return [
        ...createSidebar(sidebarOptions),
        fileExplorerState,
        fileExplorerPlugin,
        sidebarPanel.of(fileExplorerPanelSpec),
        languageCompartment.of([]), // Initialize language compartment with empty configuration
        onFileSelect ? createFileSelectPlugin(onFileSelect) : [],
    ]
}

// Export types and effects for external use
export type { File }
export {
    updateFilesEffect,
    selectFileEffect,
    setProjectNameEffect,
} from './state'
export { toggleExplorer } from './commands'
