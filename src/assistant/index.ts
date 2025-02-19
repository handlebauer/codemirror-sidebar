import { ViewPlugin, ViewUpdate, type EditorView } from '@codemirror/view'
import {
    switchTabEffect,
    addMessageEffect,
    updateMessageStatusEffect,
    selectModelEffect,
    setApiKeyEffect,
    toggleSettingsEffect,
    assistantState,
} from './lib/state'
import { renderAssistantPanel } from './lib/renderer'
import {
    createSidebar,
    sidebarPanel,
    type SidebarOptions,
    type SidebarPanelSpec,
    toggleSidebarCommand,
} from '../sidebar'
import { createSidebarKeymap } from '../sidebar/keymap'
import type { Extension } from '@codemirror/state'
import logger from '../utils/logger'
import { Facet } from '@codemirror/state'

const debug = (...args: unknown[]) => logger.debug('[Assistant]', ...args)

/**
 * Handles keyboard shortcuts for the assistant panel
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
            toggleSidebarCommand(view, 'ai-assistant')
        }
    })
}

const assistantPanelSpec: SidebarPanelSpec = {
    id: 'ai-assistant',
    create(view) {
        const dom = document.createElement('div')
        dom.className = 'cm-assistant-content'
        renderAssistantPanel(dom, view)

        // Get keymap config from options
        const keymapOpt = view.state.facet(assistantKeymap)
        if (keymapOpt) {
            setupPanelKeyboardShortcuts(dom, view, keymapOpt)
        }

        return dom
    },
    update(view) {
        const dom = view.dom.querySelector('.cm-assistant-content')
        if (dom) {
            renderAssistantPanel(dom as HTMLElement, view)
        }
    },
    onVisibilityChange(view, visible) {
        // Set the CSS variable for assistant width
        const root = view.dom
        if (visible) {
            // Get the panel width from the DOM element's style
            const panel = view.dom.querySelector(
                '.cm-sidebar-panel-container[data-dock="right"]',
            ) as HTMLElement
            const width = panel ? panel.style.width || '400px' : '400px'
            root.style.setProperty('--assistant-width', width)
            // Focus the input when panel becomes visible
            requestIdleCallback(() => {
                const textareas = view.dom.getElementsByTagName('textarea')
                if (textareas.length > 0) {
                    textareas[0].focus()
                }
            })
        } else {
            root.style.setProperty('--assistant-width', '0px')
        }
    },
}

// Store keymap config in a facet
const assistantKeymap = Facet.define<
    string | { mac?: string; win?: string },
    string | { mac?: string; win?: string }
>({
    combine: values => values[0], // Just use the first value since we only set it once
})

const assistantPlugin = ViewPlugin.fromClass(
    class {
        update(update: ViewUpdate) {
            if (
                update.state.field(assistantState) !==
                update.startState.field(assistantState)
            ) {
                const dom = update.view.dom.querySelector(
                    '.cm-ext-assistant-container, .cm-ext-assistant-settings',
                )
                if (dom) {
                    renderAssistantPanel(dom as HTMLElement, update.view)
                }
            }
        }
    },
)

export interface AssistantOptions extends Omit<SidebarOptions, 'id' | 'dock'> {
    keymap?: string | { mac: string; win: string }
    model?: 'gpt-4' | 'gpt-3.5-turbo' | 'mistral' | 'gemini'
    /**
     * Whether the assistant should be open by default
     * @default false
     */
    initiallyOpen?: boolean
}

/**
 * Creates an AI assistant sidebar extension for CodeMirror
 */
export function assistant(options: AssistantOptions = {}): Extension[] {
    const {
        keymap: keymapOpt,
        initiallyOpen = false,
        ...sidebarOptions
    } = options

    return [
        ...createSidebar({
            ...sidebarOptions,
            id: 'ai-assistant',
            dock: 'right',
            overlay: true,
            initiallyOpen,
            initialPanelId: 'ai-assistant',
        }),
        assistantState,
        sidebarPanel.of(assistantPanelSpec),
        assistantPlugin,
        // Store keymap config in facet
        keymapOpt ? assistantKeymap.of(keymapOpt) : [],
        // Add editor keymap
        createSidebarKeymap('ai-assistant', keymapOpt),
    ]
}

export {
    switchTabEffect,
    addMessageEffect,
    updateMessageStatusEffect,
    selectModelEffect,
    setApiKeyEffect,
    toggleSettingsEffect,
}

export type { Message, Model } from './types'
