import { type Extension } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { type DockPosition } from '../sidebar'
import { createSidebar, sidebarPanel, toggleSidebarCommand } from '../sidebar'
import { createSidebarKeymap } from '../sidebar/keymap'
import { Facet } from '@codemirror/state'
import logger from '../utils/logger'
import {
    explorerTheme,
    explorerThemeVariables,
    type ExplorerThemeVariables,
} from '../themes/explorer'
import { defaultExplorerOptions } from './styles'
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

// Store keymap config in a facet
const explorerKeymap = Facet.define<
    string | { mac?: string; win?: string },
    string | { mac?: string; win?: string }
>({
    combine: values => values[0], // Just use the first value since we only set it once
})

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

// Create the panel spec with keymap handling
const explorerPanelSpec = {
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
     * Which side to dock the explorer panel on
     * @default 'left'
     */
    dock?: DockPosition
    /**
     * Width of the explorer panel
     * @default '250px'
     */
    width?: string
    /**
     * Whether to show the explorer panel as an overlay
     * @default false
     */
    overlay?: boolean
    /**
     * Background color of the explorer panel
     * @default '#2c313a'
     */
    backgroundColor?: string
    /**
     * Keyboard shortcut to toggle the explorer panel
     * @example 'Cmd-b' or { mac: 'Cmd-b', win: 'Ctrl-b' }
     */
    keymap?: string | { mac?: string; win?: string }
    /**
     * Whether to open the explorer panel by default
     * @default false
     */
    initiallyOpen?: boolean
    /**
     * Callback when a file is selected
     */
    onFileSelect?: (filename: string, view: EditorView) => void
    /**
     * Theme for the explorer
     */
    theme?: Partial<ExplorerThemeVariables>
}

/**
 * Creates a file explorer extension for CodeMirror
 */
export function explorer(options: ExplorerOptions = {}): Extension[] {
    const {
        dock = defaultExplorerOptions.dock as DockPosition,
        width = defaultExplorerOptions.width,
        overlay = defaultExplorerOptions.overlay,
        backgroundColor = defaultExplorerOptions.backgroundColor,
        keymap: keymapOpt,
        initiallyOpen = defaultExplorerOptions.initiallyOpen,
        onFileSelect,
        theme = {},
    } = options

    const sidebarOptions = {
        id: 'file-explorer',
        dock,
        width,
        overlay,
        backgroundColor,
        initiallyOpen,
        initialPanelId: 'file-explorer',
        theme,
    }

    return [
        ...createSidebar(sidebarOptions),
        fileExplorerState,
        fileExplorerPlugin,
        sidebarPanel.of(explorerPanelSpec),
        languageCompartment.of([]),
        onFileSelect ? createFileSelectPlugin(onFileSelect) : [],
        keymapOpt ? explorerKeymap.of(keymapOpt) : [],
        createSidebarKeymap('file-explorer', keymapOpt),
        explorerTheme.theme,
    ]
}

// Export types and effects for external use
export type { File, ExplorerThemeVariables }
export {
    updateFilesEffect,
    selectFileEffect,
    setProjectNameEffect,
} from './state'
export { toggleExplorer } from './commands'
export { explorerThemeVariables }
