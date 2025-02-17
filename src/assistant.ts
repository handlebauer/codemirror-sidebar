import { StateField, StateEffect } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { type SidebarPanelSpec, sidebarPanel } from './sidebar'
import crelt from 'crelt'

// Debug helper
const debug = (...args: unknown[]) => console.log('[Assistant]', ...args)

// Types
interface Message {
    role: 'user' | 'assistant'
    content: string
    status?: 'sending' | 'streaming' | 'complete'
}

interface AssistantState {
    activeTab: 'assistant' | 'agent'
    messages: Message[]
    isLoading: boolean
}

// State management
const assistantState = StateField.define<AssistantState>({
    create() {
        return {
            activeTab: 'assistant',
            messages: [],
            isLoading: false,
        }
    },
    update(value, tr) {
        for (const effect of tr.effects) {
            if (effect.is(switchTabEffect)) {
                return { ...value, activeTab: effect.value }
            } else if (effect.is(addMessageEffect)) {
                return {
                    ...value,
                    messages: [...value.messages, effect.value],
                    isLoading:
                        effect.value.status === 'sending' ||
                        effect.value.status === 'streaming',
                }
            } else if (effect.is(updateMessageStatusEffect)) {
                return {
                    ...value,
                    messages: value.messages.map(msg =>
                        msg === effect.value.message
                            ? { ...msg, status: effect.value.status }
                            : msg,
                    ),
                    isLoading:
                        effect.value.status === 'sending' ||
                        effect.value.status === 'streaming',
                }
            }
        }
        return value
    },
})

// Effects
const switchTabEffect = StateEffect.define<'assistant' | 'agent'>()
const addMessageEffect = StateEffect.define<Message>()
const updateMessageStatusEffect = StateEffect.define<{
    message: Message
    status: Message['status']
}>()

// UI Rendering
function renderAssistantPanel(dom: HTMLElement, view: EditorView) {
    const state = view.state.field(assistantState)
    dom.innerHTML = '' // Clear existing content

    // Set structural styles on container
    Object.assign(dom.style, {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
    })

    // Create tabs
    const tabsContainer = crelt('div')
    Object.assign(tabsContainer.style, {
        display: 'flex',
        padding: '8px 8px 0',
        borderBottom:
            '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
    })

    const createTab = (label: string, id: 'assistant' | 'agent') => {
        const tab = crelt('button', {}, label)
        Object.assign(tab.style, {
            background: 'none',
            border: 'none',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            color: 'var(--cm-text-color, #cdc8d0)',
            opacity: state.activeTab === id ? '1' : '0.7',
            transition: 'opacity 0.2s',
        })

        if (state.activeTab === id) {
            Object.assign(tab.style, {
                background: 'var(--cm-selected-bg, rgba(255, 255, 255, 0.05))',
                borderColor: 'var(--cm-border-color, rgba(255, 255, 255, 0.1))',
                borderStyle: 'solid',
                borderWidth: '1px 1px 0 1px',
            })
        }

        tab.onclick = () => view.dispatch({ effects: switchTabEffect.of(id) })
        return tab
    }

    tabsContainer.appendChild(createTab('Assistant', 'assistant'))
    tabsContainer.appendChild(createTab('Agent', 'agent'))
    dom.appendChild(tabsContainer)

    // Create messages container
    const messagesContainer = crelt('div')
    Object.assign(messagesContainer.style, {
        flex: '1',
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    })

    state.messages.forEach(message => {
        const messageEl = crelt('div')
        Object.assign(messageEl.style, {
            maxWidth: '85%',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            lineHeight: '1.4',
            alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
            background:
                message.role === 'user'
                    ? 'var(--cm-accent-color, #4a9eff)'
                    : 'var(--cm-message-bg, rgba(255, 255, 255, 0.05))',
            color:
                message.role === 'user'
                    ? 'var(--cm-message-text, white)'
                    : 'var(--cm-text-color, #cdc8d0)',
            opacity: message.status === 'sending' ? '0.7' : '1',
        })

        const contentEl = crelt('div', {}, message.content)
        Object.assign(contentEl.style, {
            whiteSpace: 'pre-wrap',
        })

        if (message.status === 'streaming') {
            contentEl.style.borderRight =
                '2px solid var(--cm-accent-color, #4a9eff)'
            contentEl.style.animation = 'cm-blink 1s infinite'
            // Add keyframe animation inline
            const style = document.createElement('style')
            style.textContent = `
                @keyframes cm-blink {
                    50% { border-color: transparent; }
                }
            `
            document.head.appendChild(style)
        }

        messageEl.appendChild(contentEl)

        if (message.status === 'sending') {
            const loadingEl = crelt('div', {}, '...')
            Object.assign(loadingEl.style, {
                marginTop: '4px',
                opacity: '0.7',
            })
            messageEl.appendChild(loadingEl)
        }

        messagesContainer.appendChild(messageEl)
    })
    dom.appendChild(messagesContainer)

    // Create input area
    const inputContainer = crelt('div')
    Object.assign(inputContainer.style, {
        borderTop: '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
        padding: '12px',
        width: '100%',
        boxSizing: 'border-box',
    })

    const textarea = crelt('textarea', {
        placeholder: 'Ask anything, @ to mention, ↑ to select',
        rows: '3',
        onkeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const target = e.target as HTMLTextAreaElement
                const content = target.value.trim()
                if (content) {
                    debug('Sending message:', content)
                    view.dispatch({
                        effects: addMessageEffect.of({
                            role: 'user',
                            content,
                            status: 'sending',
                        }),
                    })
                    target.value = ''
                    // Schedule focus after state update
                    requestIdleCallback(() => {
                        const textareas =
                            view.dom.getElementsByTagName('textarea')
                        if (textareas.length > 0) {
                            textareas[0].focus()
                        }
                    })
                }
            }
        },
    })
    Object.assign(textarea.style, {
        width: '100%',
        boxSizing: 'border-box',
        background: 'var(--cm-input-bg, rgba(255, 255, 255, 0.05))',
        border: '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
        borderRadius: '8px',
        color: 'var(--cm-text-color, #cdc8d0)',
        padding: '8px 12px',
        fontSize: '13px',
        lineHeight: '1.4',
        resize: 'none',
        outline: 'none',
    })

    // Add focus styles
    textarea.addEventListener('focus', () => {
        textarea.style.borderColor =
            'var(--cm-border-color, rgba(255, 255, 255, 0.3))'
    })

    textarea.addEventListener('blur', () => {
        textarea.style.borderColor =
            'var(--cm-border-color, rgba(255, 255, 255, 0.1))'
    })

    inputContainer.appendChild(textarea)
    dom.appendChild(inputContainer)
}

// Panel Specification
const assistantPanelSpec: SidebarPanelSpec = {
    id: 'ai-assistant',
    create(view: EditorView): HTMLElement {
        debug('Creating assistant panel')
        const dom = crelt('div', { class: 'cm-assistant-content' })
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
    update(view: EditorView): void {
        debug('Updating assistant panel')
        const dom = view.dom.querySelector('.cm-assistant-content')
        if (dom) {
            renderAssistantPanel(dom as HTMLElement, view)
        }
    },
}

// Plugin
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

export { switchTabEffect, addMessageEffect, updateMessageStatusEffect }
