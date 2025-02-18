import { ViewPlugin, ViewUpdate, EditorView } from '@codemirror/view'
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
import type { Extension } from '@codemirror/state'

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

const assistantPanelSpec: SidebarPanelSpec = {
    id: 'ai-assistant',
    create(view) {
        const dom = document.createElement('div')
        dom.className = 'cm-assistant-content'
        renderAssistantPanel(dom, view)
        // Auto-focus textarea when panel is created
        requestIdleCallback(() => {
            const textareas = dom.getElementsByTagName('textarea')
            if (textareas.length > 0) {
                textareas[0].focus()
            }
        })
        return dom
    },
    update(view) {
        const dom = view.dom.querySelector('.cm-assistant-content')
        if (dom) {
            renderAssistantPanel(dom as HTMLElement, view)
        }
    },
}

const assistantPlugin = ViewPlugin.fromClass(
    class {
        update(update: ViewUpdate) {
            if (
                update.state.field(assistantState) !==
                update.startState.field(assistantState)
            ) {
                const dom = update.view.dom.querySelector(
                    '.cm-assistant-content',
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
}

/**
 * Creates an AI assistant sidebar extension for CodeMirror
 */
export function assistant(options: AssistantOptions = {}): Extension[] {
    const { keymap, ...sidebarOptions } = options

    // Register keymap handlers if configured
    if (keymap) {
        if (typeof keymap === 'string') {
            globalKeymapHandlers.set(keymap, view =>
                toggleSidebarCommand(view, 'ai-assistant'),
            )
        } else {
            if (keymap.mac) {
                globalKeymapHandlers.set(keymap.mac, view =>
                    toggleSidebarCommand(view, 'ai-assistant'),
                )
            }
            if (keymap.win) {
                globalKeymapHandlers.set(keymap.win, view =>
                    toggleSidebarCommand(view, 'ai-assistant'),
                )
            }
        }
    }

    return [
        ...createSidebar({
            ...sidebarOptions,
            id: 'ai-assistant',
            dock: 'right',
            overlay: true,
        }),
        assistantState,
        sidebarPanel.of(assistantPanelSpec),
        assistantPlugin,
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
