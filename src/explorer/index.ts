import { type Extension } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { type DockPosition } from '../sidebar'
import { createSidebar, sidebarPanel, toggleSidebarCommand } from '../sidebar'
import { createSidebarKeymap } from '../sidebar/keymap'
import { Facet } from '@codemirror/state'
import logger from '../utils/logger'
import {
    fileExplorerState,
    fileExplorerPanelSpec,
    type File,
    // Internal implementation details, not exported to userland
    fileExplorerPlugin,
    languageCompartment,
    selectFileEffect,
} from './state'

const debug = (...args: unknown[]) => logger.debug('[Explorer]', ...args)

/**
 * Handles keyboard shortcuts for the explorer panel
 */
function setupPanelKeyboardShortcuts(
    dom: HTMLElement,
    view: EditorView,
    keyConfig: string | { mac?: string; win?: string },
) {
    const isMac = /Mac/.test(navigator.platform)

    // Convert keyConfig to normalized format
    const keys =
        typeof keyConfig === 'string'
            ? { mac: keyConfig, win: keyConfig }
            : keyConfig

    // Create key matcher based on platform
    const targetKey = (isMac ? keys.mac : keys.win)?.toLowerCase()
    if (!targetKey) return

    debug('Setting up panel keyboard shortcuts:', { isMac, targetKey })

    // Add keyboard event listener to the panel
    dom.addEventListener('keydown', (event: KeyboardEvent) => {
        const modKey = isMac ? event.metaKey : event.ctrlKey
        if (!modKey) return

        const pressedKey = `${isMac ? 'cmd' : 'ctrl'}-${event.key.toLowerCase()}`
        debug('Key pressed in panel:', pressedKey)

        if (pressedKey === targetKey) {
            event.preventDefault()
            event.stopPropagation()
            debug('Executing panel keyboard shortcut:', targetKey)
            toggleSidebarCommand(view, 'file-explorer')
        }
    })
}

// Store keymap config in a facet
const explorerKeymap = Facet.define<
    string | { mac?: string; win?: string },
    string | { mac?: string; win?: string }
>({
    combine: values => values[0], // Just use the first value since we only set it once
})

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

// Modify the panel spec to include keymap handling
const modifiedFileExplorerPanelSpec = {
    ...fileExplorerPanelSpec,
    create(view: EditorView) {
        const dom = fileExplorerPanelSpec.create(view)

        // Get keymap config from options
        const keymapOpt = view.state.facet(explorerKeymap)
        if (keymapOpt) {
            setupPanelKeyboardShortcuts(dom, view, keymapOpt)
        }

        return dom
    },
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

/**
 * Creates a file explorer extension for CodeMirror
 */
export function explorer(options: ExplorerOptions = {}): Extension[] {
    const {
        dock = 'left',
        width = '250px',
        overlay = false,
        backgroundColor = '#2c313a',
        keymap: keymapOpt,
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

    return [
        ...createSidebar(sidebarOptions),
        fileExplorerState,
        fileExplorerPlugin,
        sidebarPanel.of(modifiedFileExplorerPanelSpec),
        languageCompartment.of([]), // Initialize language compartment with empty configuration
        onFileSelect ? createFileSelectPlugin(onFileSelect) : [],
        // Store keymap config in facet
        keymapOpt ? explorerKeymap.of(keymapOpt) : [],
        // Add editor keymap
        createSidebarKeymap('file-explorer', keymapOpt),
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
