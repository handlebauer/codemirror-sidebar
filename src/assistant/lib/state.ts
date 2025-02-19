import { StateEffect, StateField } from '@codemirror/state'
import type { ModelId, ModelProvider } from '../../ai/types'
import type { AssistantState, Message } from '../types'

// Effects
export const switchTabEffect = StateEffect.define<'assistant'>()
export const addMessageEffect = StateEffect.define<Message>()
export const updateMessageStatusEffect = StateEffect.define<{
    message: Message
    status: Message['status']
    content?: string
}>()
export const selectModelEffect = StateEffect.define<ModelId>()
export const setApiKeyEffect = StateEffect.define<{
    provider: ModelProvider
    key: string
}>()
export const toggleSettingsEffect = StateEffect.define<boolean>()

// State Field
export const assistantState = StateField.define<AssistantState>({
    create() {
        // Use the default model from AI service to determine initial selection
        const defaultModelId: ModelId = 'gpt-4'

        // Load saved API keys from localStorage
        const savedApiKeys = localStorage.getItem('cm-ai-api-keys')
        const apiKeys = savedApiKeys
            ? JSON.parse(savedApiKeys)
            : {
                  google: '',
                  openai: '',
                  mistral: '',
              }

        return {
            activeTab: 'assistant',
            messages: [],
            isLoading: false,
            selectedModel: defaultModelId,
            apiKeys,
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
                        msg.id === effect.value.message.id
                            ? {
                                  ...msg,
                                  status: effect.value.status,
                                  content: effect.value.content ?? msg.content,
                              }
                            : msg,
                    ),
                    isLoading:
                        effect.value.status === 'sending' ||
                        effect.value.status === 'streaming',
                }
            } else if (effect.is(selectModelEffect)) {
                return { ...value, selectedModel: effect.value }
            } else if (effect.is(setApiKeyEffect)) {
                const newState = {
                    ...value,
                    apiKeys: {
                        ...value.apiKeys,
                        [effect.value.provider]: effect.value.key,
                    },
                }
                // Save API keys to localStorage
                localStorage.setItem(
                    'cm-ai-api-keys',
                    JSON.stringify(newState.apiKeys),
                )
                return newState
            } else if (effect.is(toggleSettingsEffect)) {
                return { ...value, showSettings: effect.value }
            }
        }
        return value
    },
})
