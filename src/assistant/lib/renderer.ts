import { EditorView } from '@codemirror/view'
import crelt from 'crelt'
import { parseCodeBlocks, CodeBlockWidget } from './codeblock'
import {
    assistantState,
    toggleSettingsEffect,
    setApiKeyEffect,
    addMessageEffect,
    updateMessageStatusEffect,
    selectModelEffect,
} from './state'
import { aiService } from '../../ai/ai'
import type { Message } from '../types'
import type { ModelId } from '../../ai/types'
import { AVAILABLE_MODELS } from '../constants'
import { formatProviderName, mapModelToAIService } from './utils'

// Debug helper
const debug = (...args: unknown[]) =>
    console.log('[Assistant Renderer]', ...args)

export function renderAssistantPanel(dom: HTMLElement, view: EditorView) {
    const state = view.state.field(assistantState)

    // Add keyframe animation for spinner if it doesn't exist (moved from renderMessage)
    if (!document.querySelector('#cm-spin-keyframes')) {
        const style = document.createElement('style')
        style.id = 'cm-spin-keyframes'
        style.textContent = `
            @keyframes cm-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `
        document.head.appendChild(style)
    }

    if (state.showSettings) {
        renderSettingsPanel(dom, view)
        return
    }

    dom.innerHTML = '' // Clear existing content
    dom.className = 'cm-ext-assistant-container'

    // Create tabs
    const tabsContainer = crelt('div', { class: 'cm-ext-assistant-tabs' })
    const tabsGroup = crelt('div', { class: 'cm-ext-assistant-tabs-group' })

    const assistantTab = crelt(
        'button',
        {
            class: 'cm-ext-assistant-tab cm-ext-assistant-tab-active',
        },
        'Assistant',
    )
    tabsGroup.appendChild(assistantTab)

    // Create right side controls container
    const controlsContainer = crelt('div', {
        class: 'cm-ext-assistant-controls',
    })

    // Add model picker
    const modelSelect = crelt('select', {
        class: 'cm-ext-assistant-model-select',
    }) as HTMLSelectElement

    AVAILABLE_MODELS.forEach(model => {
        const option = crelt('option', { value: model.id }) as HTMLOptionElement
        option.textContent = model.name
        option.style.direction = 'ltr'
        option.style.textAlign = 'right'
        if (model.id === state.selectedModel) {
            option.selected = true
        }
        modelSelect.appendChild(option)
    })

    modelSelect.addEventListener('change', () => {
        view.dispatch({
            effects: selectModelEffect.of(modelSelect.value as ModelId),
        })
    })

    // Add settings button
    const settingsButton = crelt(
        'button',
        { class: 'cm-ext-assistant-settings-button' },
        '⚙️',
    )

    settingsButton.addEventListener('click', () => {
        debug('Settings button clicked, dispatching toggleSettingsEffect(true)')
        debug('State before dispatch:', view.state.field(assistantState))
        view.dispatch({
            effects: toggleSettingsEffect.of(true),
        })
        debug('State after dispatch:', view.state.field(assistantState))
        debug(
            'showSettings value:',
            view.state.field(assistantState).showSettings,
        )
    })

    controlsContainer.appendChild(modelSelect)
    controlsContainer.appendChild(settingsButton)
    tabsContainer.appendChild(tabsGroup)
    tabsContainer.appendChild(controlsContainer)
    dom.appendChild(tabsContainer)

    // Create messages container
    const messagesContainer = crelt('div', {
        class: 'cm-ext-assistant-messages',
    })

    // Helper function to scroll to bottom
    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight
        })
    }

    state.messages.forEach(message => {
        renderMessage(message, messagesContainer, scrollToBottom)
    })
    dom.appendChild(messagesContainer)

    // Create input container
    const inputContainer = crelt('div', { class: 'cm-ext-assistant-input' })

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
                                id: crypto.randomUUID(),
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
                        id: crypto.randomUUID(),
                        role: 'user',
                        content,
                        status: 'complete',
                    }
                    view.dispatch({
                        effects: addMessageEffect.of(userMessage),
                    })

                    // Show assistant message as streaming
                    const assistantMessage: Message = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: '', // Empty content initially
                        status: 'streaming',
                    }
                    view.dispatch({
                        effects: addMessageEffect.of(assistantMessage),
                    })

                    try {
                        // Get the current editor content
                        const editorContent = view.state.doc.toString()
                        let streamedContent = ''

                        // Use the AI service to generate text
                        const aiResponse = await aiService.generateText({
                            modelName: mapModelToAIService(state.selectedModel),
                            prompt: content,
                            editorContent: editorContent,
                            apiKey,
                            onTextContent: text => {
                                streamedContent = text
                                view.dispatch({
                                    effects: [
                                        updateMessageStatusEffect.of({
                                            message: assistantMessage,
                                            status: 'streaming',
                                            content: text,
                                        }),
                                    ],
                                })
                                // Ensure we scroll to bottom when new content is streamed
                                const messagesContainer = view.dom
                                    .querySelector('.cm-assistant-content')
                                    ?.querySelector(
                                        'div[style*="overflow-y: auto"]',
                                    )
                                if (messagesContainer) {
                                    messagesContainer.scrollTop =
                                        messagesContainer.scrollHeight
                                }
                            },
                        })

                        // Update the message with final status once streaming is complete
                        view.dispatch({
                            effects: [
                                updateMessageStatusEffect.of({
                                    message: assistantMessage,
                                    status: 'complete',
                                    content: streamedContent || aiResponse,
                                }),
                            ],
                        })
                    } catch (error) {
                        // Update with error message
                        view.dispatch({
                            effects: [
                                updateMessageStatusEffect.of({
                                    message: assistantMessage,
                                    status: 'complete',
                                    content: `Error: ${
                                        error instanceof Error
                                            ? error.message
                                            : 'An unknown error occurred'
                                    }`,
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

    inputContainer.appendChild(textarea)
    dom.appendChild(inputContainer)
}

function renderSettingsPanel(dom: HTMLElement, view: EditorView) {
    const state = view.state.field(assistantState)
    dom.innerHTML = ''
    dom.className = 'cm-ext-assistant-settings'

    // Header container with back button
    const headerContainer = crelt('div', { class: 'cm-ext-assistant-tabs' })

    // Header styled like a tab
    const header = crelt(
        'div',
        { class: 'cm-ext-assistant-tab cm-ext-assistant-tab-active' },
        'API Key Settings',
    )

    // Back button in header
    const backButton = crelt(
        'button',
        { class: 'cm-ext-assistant-settings-button' },
        '←',
    )

    backButton.addEventListener('click', () => {
        view.dispatch({
            effects: toggleSettingsEffect.of(false),
        })
        // Focus the input after returning from settings
        requestIdleCallback(() => {
            const textareas = view.dom.getElementsByTagName('textarea')
            if (textareas.length > 0) {
                textareas[0].focus()
            }
        })
    })

    headerContainer.appendChild(header)
    headerContainer.appendChild(backButton)
    dom.appendChild(headerContainer)

    // Add border right after header
    const headerBorder = crelt('div', {
        class: 'cm-ext-assistant-header-border',
    })
    dom.appendChild(headerBorder)

    // Description
    const description = crelt(
        'div',
        { class: 'cm-ext-assistant-settings-description' },
        'Keys are stored locally and never transmitted',
    )
    dom.appendChild(description)

    // API Key inputs for each provider
    const inputsContainer = crelt('div', {
        class: 'cm-ext-assistant-settings-inputs',
    })

    AVAILABLE_MODELS.forEach(model => {
        // Create provider container first
        const container = crelt('div', { class: 'cm-ext-assistant-provider' })

        // Create header inside the provider container
        const label = crelt(
            'div',
            { class: 'cm-ext-assistant-provider-header' },
            formatProviderName(model.provider),
        )
        container.appendChild(label)

        const messageContainer = crelt('div', {
            class:
                'cm-ext-assistant-provider-message' +
                (state.apiKeys[model.provider] ? ' has-api-key' : ''),
        })

        if (state.apiKeys[model.provider]) {
            const checkmark = crelt('span', { class: 'checkmark' }, '✓')
            messageContainer.appendChild(checkmark)
            messageContainer.appendChild(
                document.createTextNode('API key configured.'),
            )

            const resetButton = crelt(
                'button',
                { class: 'cm-ext-assistant-settings-button' },
                'Reset key',
            )

            resetButton.addEventListener('click', () => {
                input.value = ''
                view.dispatch({
                    effects: setApiKeyEffect.of({
                        provider: model.provider,
                        key: '',
                    }),
                })
                messageContainer.classList.remove('has-api-key')
                inputGroup.classList.remove('has-api-key')
            })

            messageContainer.appendChild(resetButton)
        }

        const inputGroup = crelt('div', {
            class:
                'cm-ext-assistant-provider-input' +
                (state.apiKeys[model.provider] ? ' has-api-key' : ''),
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
        container.appendChild(messageContainer)
        container.appendChild(inputGroup)

        // Only append the container to inputs container
        inputsContainer.appendChild(container)
    })

    dom.appendChild(inputsContainer)
}

export function renderMessage(
    message: Message,
    container: HTMLElement,
    scrollToBottom: () => void,
) {
    // Add loading spinner before the message if it's streaming and empty
    if (message.status === 'streaming' && !message.content) {
        const loadingContainer = crelt('div', {
            class: 'cm-ext-assistant-loading',
        })
        const spinner = crelt('div', { class: 'cm-ext-assistant-spinner' })
        loadingContainer.appendChild(spinner)
        container.appendChild(loadingContainer)
    }

    // Only show message if it has content or is not streaming
    if (message.content || message.status !== 'streaming') {
        const messageEl = crelt('div', {
            class: `cm-ext-assistant-message ${
                message.role === 'user'
                    ? 'cm-ext-assistant-message-user'
                    : 'cm-ext-assistant-message-bot'
            }`,
        })

        const contentEl = crelt('div', {
            class: 'cm-ext-assistant-message-content',
        })

        // First, find all complete code blocks and their positions
        const codeBlocks = parseCodeBlocks(message.content)
        let lastPos = 0
        const segments: Array<{
            type: 'text' | 'code' | 'incomplete-code'
            content: string
            language?: string | null
        }> = []

        // Split content into text and code segments
        codeBlocks.forEach(block => {
            if (block.from > lastPos) {
                // Add text segment before code block
                segments.push({
                    type: 'text',
                    content: message.content.slice(lastPos, block.from),
                })
            }
            // Add code block
            segments.push({
                type: 'code',
                content: block.code,
                language: block.language,
            })
            lastPos = block.to
        })

        // Check for incomplete code block at the end during streaming
        if (message.status === 'streaming') {
            const remainingContent = message.content.slice(lastPos)
            const incompleteBlockMatch = /```([a-zA-Z]*)\n([\s\S]*)$/.exec(
                remainingContent,
            )

            if (incompleteBlockMatch) {
                const incompleteBlockStart = remainingContent.lastIndexOf('```')
                if (incompleteBlockStart > 0) {
                    // Add text before the incomplete block
                    segments.push({
                        type: 'text',
                        content: remainingContent.slice(
                            0,
                            incompleteBlockStart,
                        ),
                    })
                }
                // Add the incomplete block
                segments.push({
                    type: 'incomplete-code',
                    content: '', // Don't include the content while streaming
                    language: incompleteBlockMatch[1] || null,
                })
            } else {
                // No incomplete block, just add remaining text
                if (remainingContent) {
                    segments.push({
                        type: 'text',
                        content: remainingContent,
                    })
                }
            }
        } else {
            // Not streaming, just add any remaining content as text
            if (lastPos < message.content.length) {
                segments.push({
                    type: 'text',
                    content: message.content.slice(lastPos),
                })
            }
        }

        // Process each segment
        segments.forEach(segment => {
            if (segment.type === 'code' || segment.type === 'incomplete-code') {
                const codeBlockContainer = crelt('div', {
                    class: 'cm-ext-assistant-code',
                })
                const widget = new CodeBlockWidget(
                    segment.type === 'code' ? segment.content : '',
                    segment.language || null,
                    segment.type === 'incomplete-code',
                )
                codeBlockContainer.appendChild(widget.toDOM())
                contentEl.appendChild(codeBlockContainer)
            } else if (segment.type === 'text') {
                // Process text segment for inline code
                const textContainer = crelt('div', {
                    class: 'cm-ext-assistant-text-container',
                })
                const inlineCodeRegex = /(?<!`)`([^`]+)`(?!`)/g
                const processedText = segment.content.replace(
                    inlineCodeRegex,
                    (_, code) =>
                        `<code class="cm-ext-assistant-inline-code">${code}</code>`,
                )
                textContainer.innerHTML = processedText
                contentEl.appendChild(textContainer)
            }
        })

        messageEl.appendChild(contentEl)
        container.appendChild(messageEl)
        scrollToBottom()
    }
}
