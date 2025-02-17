import { ViewPlugin, ViewUpdate } from '@codemirror/view'
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
import { sidebarPanel, type SidebarPanelSpec } from '../sidebar'

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

export const assistant = [
    assistantState,
    assistantPlugin,
    sidebarPanel.of(assistantPanelSpec),
]

export {
    switchTabEffect,
    addMessageEffect,
    updateMessageStatusEffect,
    selectModelEffect,
    setApiKeyEffect,
    toggleSettingsEffect,
}

export type { Message, Model } from './types'
