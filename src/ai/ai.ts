import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createMistral } from '@ai-sdk/mistral'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import logger from '../utils/logger'

const DEFAULT_MODEL = 'openai:gpt-4o'

interface GenerateTextParams {
    modelName: string
    prompt: string
    editorContent: string
    apiKey?: string
    onTextContent?: (text: string) => void
}

interface AIService {
    generateText: (params: GenerateTextParams) => Promise<string>
}

// Debug helper
const debug = (...args: unknown[]) =>
    logger.debug({ module: 'AI' }, args.join(' '))

const createAIService = (): AIService => {
    const generateTextFn = async ({
        modelName,
        prompt,
        editorContent,
        apiKey,
        onTextContent,
    }: GenerateTextParams): Promise<string> => {
        if (!apiKey) {
            throw new Error(
                'API key is required. Please configure it in settings.',
            )
        }

        // Add editor content as part of the prompt context
        const fullPrompt = `Current Editor Content:\n${editorContent}\n\n${prompt}`

        let result
        let fullText = ''

        debug('Generating text for model:', modelName)
        debug('Prompt:', fullPrompt)

        try {
            const systemPrompt =
                'You are a helpful assistant that can help with coding tasks.'
            switch (modelName) {
                case 'openai:gpt-4o': {
                    // DO NOT DELETE THIS COMMENTED OUT CODE
                    // const openaiClient = createOpenAI({
                    //     apiKey,
                    //     compatibility: 'strict',
                    // })
                    // result = await streamText({
                    //     model: openaiClient('gpt-4'),
                    //     system: 'You are a helpful assistant that can help with coding tasks.',
                    //     prompt: fullPrompt,
                    // })

                    // Simulate a realistic streaming response
                    const simulatedResponse = [
                        "# Here's a simulated response with code examples\n\n",
                        "## Let's start with a simple inline code example: ",
                        "`console.log('hello world')`\n\n",
                        "Here's a multiline code block:\n\n```jav",
                        'ascript\nfunction greet(name) {\n',
                        '    console.log(`Hello, ${name}!`)\n    return {\n}\n',
                        '    console.log(`Hello, ${name}!`)\n    return {\n',
                        "        message: 'Greeting sent',\n        timestamp: new Date()\n    }\n}\n\n",
                        "// Example usage\nconst result = greet('Developer')\n```\n\n",
                        'You can also use inline code for variables like `result` or ',
                        "`name`.\n\nHere's another code block with a different language:\n\n",
                        '```python\ndef calculate_sum(numbers):\n    total = 0\n',
                        '    for num in numbers:\n        total += num\n    return total\n\n',
                        '# Test the function\nnumbers = [1, 2, 3, 4, 5]\nprint(f"Sum: {calculate_sum(numbers)}")\n```',
                    ]

                    result = {
                        textStream: (async function* () {
                            for (const chunk of simulatedResponse) {
                                await new Promise(resolve =>
                                    setTimeout(resolve, 400),
                                )
                                yield chunk
                            }
                        })(),
                    }
                    break
                }
                case 'mistral:large': {
                    const mistralClient = createMistral({
                        apiKey,
                    })
                    result = streamText({
                        model: mistralClient('mistral-large-latest'),
                        system: systemPrompt,
                        prompt: fullPrompt,
                    })
                    break
                }
                case 'google:gemini-2.0-flash-001': {
                    const googleClient = createGoogleGenerativeAI({
                        apiKey,
                    })
                    result = streamText({
                        model: googleClient('gemini-2.0-flash-001'),
                        system: systemPrompt,
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
                    result = streamText({
                        model: openaiClient('gpt-4'),
                        system: systemPrompt,
                        prompt: fullPrompt,
                    })
                }
            }

            // Process the stream
            for await (const textPart of result.textStream) {
                fullText += textPart
                onTextContent?.(fullText)
            }

            return fullText
        } catch (error) {
            debug('Error:', error)
            throw error
        }
    }

    return {
        generateText: generateTextFn,
    }
}

export const aiService = createAIService()
export type { AIService, GenerateTextParams }
export { DEFAULT_MODEL }
