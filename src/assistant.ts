import { StateField, StateEffect } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { type SidebarPanelSpec, sidebarPanel } from './sidebar'
import crelt from 'crelt'
import { aiService, DEFAULT_MODEL } from './ai/ai'
import { type AISidebarTab } from './ai/types'

// Debug helper
const debug = (...args: unknown[]) => console.log('[Assistant]', ...args)

// Types
interface Message {
    role: 'user' | 'assistant'
    content: string
    status?: 'sending' | 'streaming' | 'complete'
}

type ModelProvider = 'google' | 'openai' | 'mistral'
type ModelId = 'gemini-pro' | 'gpt-4' | 'mistral-large'

interface Model {
    id: ModelId
    provider: ModelProvider
    name: string
    description: string
}

// Model mapping function
const mapModelToAIService = (modelId: ModelId): string => {
    switch (modelId) {
        case 'gemini-pro':
            return 'google:gemini-2.0-flash-001'
        case 'gpt-4':
            return 'openai:gpt-4o'
        case 'mistral-large':
            return 'mistral:large'
        default:
            return DEFAULT_MODEL
    }
}

// Helper function to format provider names
const formatProviderName = (provider: ModelProvider): string => {
    switch (provider) {
        case 'openai':
            return 'OpenAI'
        default:
            return provider.charAt(0).toUpperCase() + provider.slice(1)
    }
}

const AVAILABLE_MODELS: Model[] = [
    {
        id: 'gemini-pro',
        provider: 'google',
        name: 'Gemini Pro',
        description: "Google's most capable model for text generation",
    },
    {
        id: 'gpt-4',
        provider: 'openai',
        name: 'GPT-4o',
        description: "OpenAI's most capable model",
    },
    {
        id: 'mistral-large',
        provider: 'mistral',
        name: 'Mistral Large',
        description: "Mistral's largest open model",
    },
]

interface AssistantState {
    activeTab: AISidebarTab
    messages: Message[]
    isLoading: boolean
    selectedModel: ModelId
    apiKeys: Record<ModelProvider, string>
    showSettings: boolean
}

// State management
const assistantState = StateField.define<AssistantState>({
    create() {
        // Use the default model from AI service to determine initial selection
        const defaultModelId: ModelId = DEFAULT_MODEL.includes('openai')
            ? 'gpt-4'
            : DEFAULT_MODEL.includes('google')
              ? 'gemini-pro'
              : 'mistral-large'

        return {
            activeTab: 'assistant',
            messages: [],
            isLoading: false,
            selectedModel: defaultModelId,
            apiKeys: {
                google: '',
                openai: '',
                mistral: '',
            },
            showSettings: false,
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
            } else if (effect.is(selectModelEffect)) {
                return { ...value, selectedModel: effect.value }
            } else if (effect.is(setApiKeyEffect)) {
                return {
                    ...value,
                    apiKeys: {
                        ...value.apiKeys,
                        [effect.value.provider]: effect.value.key,
                    },
                }
            } else if (effect.is(toggleSettingsEffect)) {
                return { ...value, showSettings: effect.value }
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
const selectModelEffect = StateEffect.define<ModelId>()
const setApiKeyEffect = StateEffect.define<{
    provider: ModelProvider
    key: string
}>()
const toggleSettingsEffect = StateEffect.define<boolean>()

function renderSettingsPanel(dom: HTMLElement, view: EditorView) {
    const state = view.state.field(assistantState)
    dom.innerHTML = ''

    // Container styles
    Object.assign(dom.style, {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: '12px 12px 0',
    })

    // Header container with back button
    const headerContainer = crelt('div')
    Object.assign(headerContainer.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '32px',
    })

    // Header styled like a tab
    const header = crelt('div', {}, 'API Key Settings')
    Object.assign(header.style, {
        fontSize: '13px',
        fontWeight: '500',
        color: 'var(--cm-text-color, #cdc8d0)',
        padding: '6px 10px',
        background: 'var(--cm-selected-bg, rgba(255, 255, 255, 0.05))',
        borderRadius: '4px 4px 0 0',
        marginBottom: '-1px',
        borderBottom:
            '1px solid var(--cm-selected-bg, rgba(255, 255, 255, 0.05))',
    })

    // Back button in header
    const backButton = crelt('button', {}, '←')
    Object.assign(backButton.style, {
        background: 'none',
        border: 'none',
        padding: '6px 8px',
        fontSize: '16px',
        cursor: 'pointer',
        opacity: '0.7',
        transition: 'opacity 0.2s',
        color: 'var(--cm-text-color, #cdc8d0)',
    })

    backButton.addEventListener('mouseover', () => {
        backButton.style.opacity = '1'
    })

    backButton.addEventListener('mouseout', () => {
        backButton.style.opacity = '0.7'
    })

    backButton.addEventListener('click', () => {
        view.dispatch({
            effects: toggleSettingsEffect.of(false),
        })
    })

    headerContainer.appendChild(header)
    headerContainer.appendChild(backButton)
    dom.appendChild(headerContainer)

    // Add border right after header
    const headerBorder = crelt('div')
    Object.assign(headerBorder.style, {
        height: '1px',
        background: 'var(--cm-border-color, rgba(255, 255, 255, 0.1))',
        margin: '-2px 0 12px',
    })
    dom.appendChild(headerBorder)

    // Description with adjusted margins
    const description = crelt(
        'div',
        {},
        'Configure API keys for each model provider. Keys are stored locally and never transmitted.',
    )
    Object.assign(description.style, {
        fontSize: '12px',
        marginTop: '12px',
        marginBottom: '16px',
        color: 'var(--cm-text-color, #cdc8d0)',
        opacity: '0.7',
    })
    dom.appendChild(description)

    // API Key inputs for each provider
    const inputsContainer = crelt('div')
    Object.assign(inputsContainer.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    })

    AVAILABLE_MODELS.forEach(model => {
        const container = crelt('div')
        Object.assign(container.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px',
            background: 'var(--cm-input-bg, rgba(255, 255, 255, 0.03))',
            borderRadius: '4px',
        })

        const headerContainer = crelt('div')
        Object.assign(headerContainer.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '20px',
        })

        const label = crelt('label', {}, formatProviderName(model.provider))
        Object.assign(label.style, {
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--cm-text-color, #cdc8d0)',
            lineHeight: '20px',
        })

        const resetButton = crelt('button', {}, 'Reset key')
        Object.assign(resetButton.style, {
            background: 'none',
            border: 'none',
            padding: '4px 8px',
            fontSize: '12px',
            color: 'var(--cm-text-color, #cdc8d0)',
            cursor: 'pointer',
            opacity: '0.7',
            transition: 'opacity 0.2s',
            display: state.apiKeys[model.provider] ? 'block' : 'none',
        })

        resetButton.addEventListener('mouseover', () => {
            resetButton.style.opacity = '1'
        })

        resetButton.addEventListener('mouseout', () => {
            resetButton.style.opacity = '0.7'
        })

        resetButton.addEventListener('click', () => {
            input.value = ''
            view.dispatch({
                effects: setApiKeyEffect.of({
                    provider: model.provider,
                    key: '',
                }),
            })
        })

        headerContainer.appendChild(label)
        headerContainer.appendChild(resetButton)

        const messageContainer = crelt('div')
        Object.assign(messageContainer.style, {
            fontSize: '12px',
            color: 'var(--cm-text-color, #cdc8d0)',
            opacity: '0.7',
            padding: '6px 12px',
            display: state.apiKeys[model.provider] ? 'flex' : 'none',
            alignItems: 'center',
            background: 'var(--cm-input-bg, rgba(255, 255, 255, 0.05))',
            borderRadius: '4px',
            height: '33px',
            boxSizing: 'border-box',
        })

        if (state.apiKeys[model.provider]) {
            const checkmark = crelt('span', {}, '✓')
            Object.assign(checkmark.style, {
                color: 'var(--cm-success-color, #4caf50)',
                marginRight: '4px',
            })
            messageContainer.appendChild(checkmark)
            messageContainer.appendChild(
                document.createTextNode('API key configured.'),
            )
        }

        const inputGroup = crelt('div')
        Object.assign(inputGroup.style, {
            display: state.apiKeys[model.provider] ? 'none' : 'flex',
            gap: '8px',
        })

        const input = crelt('input', {
            type: 'password',
            value: state.apiKeys[model.provider] || '',
            placeholder:
                model.provider === 'google'
                    ? 'AIzaSy...'
                    : model.provider === 'openai'
                      ? 'sk-000000000000000000000000000000000000000000000000'
                      : 'ottggm...',
        }) as HTMLInputElement

        Object.assign(input.style, {
            flex: '1',
            background: 'var(--cm-input-bg, rgba(255, 255, 255, 0.05))',
            border: '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '13px',
            color: 'var(--cm-text-color, #cdc8d0)',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'monospace',
        })

        // Only update state on blur or enter key
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                input.blur()
            }
        })

        input.addEventListener('blur', () => {
            if (input.value) {
                view.dispatch({
                    effects: setApiKeyEffect.of({
                        provider: model.provider,
                        key: input.value,
                    }),
                })
            }
        })

        // Add focus styles
        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--cm-accent-color, #4a9eff)'
            input.style.boxShadow = '0 0 0 1px var(--cm-accent-color, #4a9eff)'
        })

        input.addEventListener('blur', () => {
            input.style.borderColor =
                'var(--cm-border-color, rgba(255, 255, 255, 0.1))'
            input.style.boxShadow = 'none'
        })

        inputGroup.appendChild(input)
        container.appendChild(headerContainer)
        container.appendChild(messageContainer)
        container.appendChild(inputGroup)
        inputsContainer.appendChild(container)
    })

    dom.appendChild(inputsContainer)
}

// UI Rendering
function renderAssistantPanel(dom: HTMLElement, view: EditorView) {
    const state = view.state.field(assistantState)

    if (state.showSettings) {
        renderSettingsPanel(dom, view)
        return
    }

    dom.innerHTML = '' // Clear existing content

    // Set structural styles on container
    Object.assign(dom.style, {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: '12px 12px 0',
    })

    // Create tabs
    const tabsContainer = crelt('div')
    Object.assign(tabsContainer.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '32px',
    })

    const tabsGroup = crelt('div')
    Object.assign(tabsGroup.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    })

    const createTab = (label: string, id: 'assistant' | 'agent') => {
        const tab = crelt('button', {}, label)
        Object.assign(tab.style, {
            background: 'none',
            border: 'none',
            padding: '6px 10px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            color: 'var(--cm-text-color, #cdc8d0)',
            opacity: state.activeTab === id ? '1' : '0.7',
            transition: 'opacity 0.2s',
            marginBottom: '-1px',
        })

        if (state.activeTab === id) {
            Object.assign(tab.style, {
                background: 'var(--cm-selected-bg, rgba(255, 255, 255, 0.05))',
                borderBottom:
                    '1px solid var(--cm-selected-bg, rgba(255, 255, 255, 0.05))',
            })
        }

        tab.onclick = () => view.dispatch({ effects: switchTabEffect.of(id) })
        return tab
    }

    tabsGroup.appendChild(createTab('Assistant', 'assistant'))
    tabsGroup.appendChild(createTab('Agent', 'agent'))

    // Add settings button
    const settingsButton = crelt('button', {}, '⚙️')
    Object.assign(settingsButton.style, {
        background: 'none',
        border: 'none',
        padding: '6px 8px',
        fontSize: '16px',
        cursor: 'pointer',
        opacity: '0.7',
        transition: 'opacity 0.2s',
        marginLeft: '8px',
    })

    settingsButton.addEventListener('mouseover', () => {
        settingsButton.style.opacity = '1'
    })

    settingsButton.addEventListener('mouseout', () => {
        settingsButton.style.opacity = '0.7'
    })

    settingsButton.addEventListener('click', () => {
        view.dispatch({
            effects: toggleSettingsEffect.of(true),
        })
    })

    tabsContainer.appendChild(tabsGroup)
    tabsContainer.appendChild(settingsButton)
    dom.appendChild(tabsContainer)

    // Add border right after tabs
    const headerBorder = crelt('div')
    Object.assign(headerBorder.style, {
        height: '1px',
        background: 'var(--cm-border-color, rgba(255, 255, 255, 0.1))',
        margin: '-2px 0 12px',
    })
    dom.appendChild(headerBorder)

    // Create messages container with adjusted padding
    const messagesContainer = crelt('div')
    Object.assign(messagesContainer.style, {
        flex: '1',
        overflowY: 'auto',
        padding: '12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
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
        onkeydown: async (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const target = e.target as HTMLTextAreaElement
                const content = target.value.trim()
                if (content) {
                    debug('Sending message:', content)

                    // Get the current model's provider
                    const selectedModel = AVAILABLE_MODELS.find(
                        m => m.id === state.selectedModel,
                    )
                    if (!selectedModel) {
                        console.error('Selected model not found')
                        return
                    }

                    // Get the API key for the selected provider
                    const apiKey = state.apiKeys[selectedModel.provider]
                    if (!apiKey) {
                        view.dispatch({
                            effects: addMessageEffect.of({
                                role: 'assistant',
                                content: `Error: Please configure the API key for ${selectedModel.name} in settings.`,
                                status: 'complete',
                            }),
                        })
                        return
                    }

                    // Clear input and show user message as sending
                    target.value = ''
                    const userMessage: Message = {
                        role: 'user',
                        content,
                        status: 'sending',
                    }
                    view.dispatch({
                        effects: addMessageEffect.of(userMessage),
                    })

                    // Show assistant message as streaming
                    const assistantMessage: Message = {
                        role: 'assistant',
                        content: 'Thinking...',
                        status: 'streaming',
                    }
                    view.dispatch({
                        effects: addMessageEffect.of(assistantMessage),
                    })

                    try {
                        // Get the current editor content
                        const editorContent = view.state.doc.toString()

                        // Use the AI service to generate text
                        const aiResponse = await aiService.generateText({
                            modelName: mapModelToAIService(state.selectedModel),
                            prompt: content,
                            editorContent: editorContent,
                            apiKey,
                        })

                        // Update messages to complete
                        view.dispatch({
                            effects: [
                                updateMessageStatusEffect.of({
                                    message: userMessage,
                                    status: 'complete',
                                }),
                                addMessageEffect.of({
                                    role: 'assistant',
                                    content: aiResponse,
                                    status: 'complete',
                                }),
                            ],
                        })
                    } catch (error) {
                        // Handle error by showing error message
                        view.dispatch({
                            effects: [
                                updateMessageStatusEffect.of({
                                    message: userMessage,
                                    status: 'complete',
                                }),
                                addMessageEffect.of({
                                    role: 'assistant',
                                    content: `Error: ${
                                        error instanceof Error
                                            ? error.message
                                            : 'An unknown error occurred'
                                    }`,
                                    status: 'complete',
                                }),
                            ],
                        })
                    }

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

export {
    switchTabEffect,
    addMessageEffect,
    updateMessageStatusEffect,
    selectModelEffect,
    setApiKeyEffect,
    toggleSettingsEffect,
}

export type { Message, ModelProvider, ModelId, Model }
