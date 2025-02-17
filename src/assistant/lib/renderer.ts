import { EditorView } from '@codemirror/view'
import crelt from 'crelt'
import { parseCodeBlocks, renderCodeBlock } from './codeblock'
import {
    assistantState,
    toggleSettingsEffect,
    setApiKeyEffect,
    addMessageEffect,
    updateMessageStatusEffect,
    selectModelEffect,
    switchTabEffect,
} from './state'
import { aiService } from '../../ai/ai'
import type { Message } from '../types'
import type { ModelId } from '../../ai/types'
import { AVAILABLE_MODELS } from '../constants'
import { formatProviderName, mapModelToAIService } from './utils'
import * as styles from './styles'

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

    // Set structural styles on container
    Object.assign(dom.style, styles.containerStyles)

    // Create tabs
    const tabsContainer = crelt('div')
    Object.assign(tabsContainer.style, styles.tabsContainerStyles)

    const tabsGroup = crelt('div')
    Object.assign(tabsGroup.style, styles.tabsGroupStyles)

    const createTab = (label: string, id: 'assistant' | 'agent') => {
        const tab = crelt('button', {}, label)
        Object.assign(tab.style, styles.getTabStyles(state.activeTab === id))
        tab.onclick = () => view.dispatch({ effects: switchTabEffect.of(id) })
        return tab
    }

    tabsGroup.appendChild(createTab('Assistant', 'assistant'))
    tabsGroup.appendChild(createTab('Agent', 'agent'))

    // Create right side controls container
    const controlsContainer = crelt('div')
    Object.assign(controlsContainer.style, styles.controlsContainerStyles)

    // Add model picker
    const modelSelect = crelt('select') as HTMLSelectElement
    Object.assign(modelSelect.style, styles.modelSelectStyles)

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
    const settingsButton = crelt('button', {}, '⚙️')
    Object.assign(settingsButton.style, styles.settingsButtonStyles)

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

    controlsContainer.appendChild(modelSelect)
    controlsContainer.appendChild(settingsButton)
    tabsContainer.appendChild(tabsGroup)
    tabsContainer.appendChild(controlsContainer)
    dom.appendChild(tabsContainer)

    // Add border right after tabs
    const headerBorder = crelt('div')
    Object.assign(headerBorder.style, styles.headerBorderStyles)
    dom.appendChild(headerBorder)

    // Create messages container
    const messagesContainer = crelt('div')
    Object.assign(messagesContainer.style, styles.messagesContainerStyles)

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

    // Create input area
    const inputContainer = crelt('div')
    Object.assign(inputContainer.style, styles.inputContainerStyles)

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
    Object.assign(textarea.style, styles.textareaStyles)

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

function renderSettingsPanel(dom: HTMLElement, view: EditorView) {
    const state = view.state.field(assistantState)
    dom.innerHTML = ''

    // Container styles
    Object.assign(dom.style, styles.settingsPanelContainerStyles)

    // Header container with back button
    const headerContainer = crelt('div')
    Object.assign(headerContainer.style, styles.tabsContainerStyles)

    // Header styled like a tab
    const header = crelt('div', {}, 'API Key Settings')
    Object.assign(header.style, styles.settingsHeaderStyles)

    // Back button in header
    const backButton = crelt('button', {}, '←')
    Object.assign(backButton.style, styles.settingsButtonStyles)

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
    Object.assign(headerBorder.style, styles.headerBorderStyles)
    dom.appendChild(headerBorder)

    // Description with adjusted margins
    const description = crelt(
        'div',
        {},
        'Configure API keys for each model provider. Keys are stored locally and never transmitted.',
    )
    Object.assign(description.style, styles.settingsDescriptionStyles)
    dom.appendChild(description)

    // API Key inputs for each provider
    const inputsContainer = crelt('div')
    Object.assign(inputsContainer.style, styles.settingsInputsContainerStyles)

    AVAILABLE_MODELS.forEach(model => {
        const container = crelt('div')
        Object.assign(container.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 12px 6px 12px',
            background: 'var(--cm-input-bg, rgba(255, 255, 255, 0.03))',
            borderRadius: '4px',
        })

        const headerContainer = crelt('div')
        Object.assign(headerContainer.style, styles.tabsContainerStyles)

        const label = crelt('label', {}, formatProviderName(model.provider))
        Object.assign(label.style, styles.providerHeaderStyles)

        const resetButton = crelt('button', {}, 'Reset key')
        Object.assign(resetButton.style, {
            ...styles.settingsButtonStyles,
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
        Object.assign(
            messageContainer.style,
            styles.settingsMessageContainerStyles(
                !!state.apiKeys[model.provider],
            ),
        )

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
        Object.assign(
            inputGroup.style,
            styles.getSettingsInputStyles(!!state.apiKeys[model.provider]),
        )

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

        Object.assign(input.style, styles.settingsInputFieldStyles)

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

export function renderMessage(
    message: Message,
    container: HTMLElement,
    scrollToBottom: () => void,
) {
    // Add loading spinner before the message if it's streaming and empty
    if (message.status === 'streaming' && !message.content) {
        const loadingContainer = crelt('div')
        Object.assign(loadingContainer.style, styles.loadingContainerStyles)

        const spinner = crelt('div')
        Object.assign(spinner.style, styles.spinnerStyles)

        loadingContainer.appendChild(spinner)
        container.appendChild(loadingContainer)
    }

    // Only show message if it has content or is not streaming
    if (message.content || message.status !== 'streaming') {
        const messageEl = crelt('div')
        Object.assign(
            messageEl.style,
            styles.getMessageStyles(message.role === 'user'),
        )

        const contentEl = crelt('div')
        Object.assign(contentEl.style, styles.messageContentStyles)

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
                renderCodeBlock(
                    {
                        type: segment.type,
                        content: segment.content,
                        language: segment.language,
                    },
                    contentEl,
                )
            } else if (segment.type === 'text') {
                // Process text segment for inline code
                const textContainer = crelt('div')
                Object.assign(textContainer.style, styles.textContainerStyles)
                const inlineCodeRegex = /(?<!`)`([^`]+)`(?!`)/g
                const processedText = segment.content.replace(
                    inlineCodeRegex,
                    (_, code) =>
                        `<code style="${styles.inlineCodeStyles}">${code}</code>`,
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
