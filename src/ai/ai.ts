import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createMistral } from '@ai-sdk/mistral'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const DEFAULT_MODEL = 'openai:gpt-4o'

interface GenerateTextParams {
    modelName: string
    prompt: string
    editorContent: string
    apiKey?: string
}

interface AIService {
    generateText: (params: GenerateTextParams) => Promise<string>
    // Placeholder for agent calls in the future:
    // callAgent: (params: AgentCallParams) => Promise<AgentCallResult>
}

// Debug helper
const debug = (...args: unknown[]) => console.log('[AI]', ...args)

const createAIService = (): AIService => {
    const generateTextFn = async ({
        modelName,
        prompt,
        editorContent,
        apiKey,
    }: GenerateTextParams): Promise<string> => {
        if (!apiKey) {
            throw new Error(
                'API key is required. Please configure it in settings.',
            )
        }

        // Add editor content as part of the prompt context
        const fullPrompt = `Current Editor Content:\n${editorContent}\n\n${prompt}`

        let result

        debug('Generating text for model:', modelName)
        debug('Prompt:', fullPrompt)

        try {
            switch (modelName) {
                case 'openai:gpt-4o': {
                    const openaiClient = createOpenAI({
                        apiKey,
                        compatibility: 'strict',
                    })
                    result = await generateText({
                        model: openaiClient('gpt-4'),
                        system: 'You are a helpful assistant that can help with coding tasks.',
                        prompt: fullPrompt,
                    })
                    break
                }
                case 'mistral:large': {
                    const mistralClient = createMistral({
                        apiKey,
                    })
                    result = await generateText({
                        model: mistralClient('mistral-large-latest'),
                        system: 'You are a helpful assistant that can help with coding tasks.',
                        prompt: fullPrompt,
                    })
                    break
                }
                case 'google:gemini-2.0-flash-001': {
                    const googleClient = createGoogleGenerativeAI({
                        apiKey,
                    })
                    result = await generateText({
                        model: googleClient('gemini-2.0-flash-001'),
                        system: 'You are a helpful assistant that can help with coding tasks.',
                        prompt: fullPrompt,
                    })
                    break
                }
                default: {
                    console.warn(
                        `Unknown model: ${modelName}. Using default model.`,
                    )
                    const openaiClient = createOpenAI({
                        apiKey,
                        compatibility: 'strict',
                    })
                    result = await generateText({
                        model: openaiClient('gpt-4'),
                        prompt: fullPrompt,
                    })
                }
            }

            return result.text
        } catch (error) {
            debug('Error:', error)
            throw error
        }
    }

    return {
        generateText: generateTextFn,
        // Placeholder for agent calls
        // callAgent: async (params: AgentCallParams) => { ... }
    }
}

export const aiService = createAIService()
export type { AIService }
export { DEFAULT_MODEL }
