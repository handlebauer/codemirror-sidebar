import type { ModelProvider, ModelId } from '~/ai/types'

export interface Model {
    id: ModelId
    provider: ModelProvider
    name: string
    description: string
}

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    status?: 'sending' | 'streaming' | 'complete'
}

export interface AssistantState {
    activeTab: 'assistant'
    messages: Message[]
    isLoading: boolean
    selectedModel: ModelId
    apiKeys: Record<ModelProvider, string>
    showSettings: boolean
}
