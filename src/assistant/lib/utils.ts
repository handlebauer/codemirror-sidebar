import { LanguageSupport } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { DEFAULT_MODEL } from '../../ai/ai'

import type { ModelId, ModelProvider } from '~/ai/types'

export const getLanguageSupport = (lang: string): LanguageSupport | null => {
    const normalizedLang = lang.toLowerCase().trim()
    switch (normalizedLang) {
        case 'javascript':
        case 'js':
            return javascript()
        case 'typescript':
        case 'ts':
            return javascript({ typescript: true })
        case 'python':
        case 'py':
            return python()
        case 'markdown':
        case 'md':
            return markdown()
        default:
            return null
    }
}

export const mapModelToAIService = (modelId: ModelId): string => {
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
export const formatProviderName = (provider: ModelProvider): string => {
    switch (provider) {
        case 'openai':
            return 'OpenAI'
        default:
            return provider.charAt(0).toUpperCase() + provider.slice(1)
    }
}
