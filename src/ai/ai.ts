import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createMistral } from '@ai-sdk/mistral'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

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
                    // Simulate a simple response for testing
                    const simulatedResponse = `# Here's a simulated response with code examples

## Let's start with a simple inline code example: \`console.log('hello world')\`

Here's a multiline code block:

\`\`\`javascript
function greet(name) {
    console.log(\`Hello, \${name}!\`)
    return {
        message: 'Greeting sent',
        timestamp: new Date()
    }
}

// Example usage
const result = greet('Developer')
\`\`\`

You can also use inline code for variables like \`result\` or \`name\`.

Here's another code block with a different language:

\`\`\`python
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total

# Test the function
numbers = [1, 2, 3, 4, 5]
print(f"Sum: {calculate_sum(numbers)}")
\`\`\`
`
                    result = {
                        textStream: (async function* () {
                            yield simulatedResponse
                        })(),
                    }
                    break
                }
                case 'mistral:large': {
                    const mistralClient = createMistral({
                        apiKey,
                    })
                    result = await streamText({
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
                    result = await streamText({
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
                    result = await streamText({
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
        // Placeholder for agent calls
        // callAgent: async (params: AgentCallParams) => { ... }
    }
}

export const aiService = createAIService()
export type { AIService, GenerateTextParams }
export { DEFAULT_MODEL }
