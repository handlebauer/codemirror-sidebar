export type AISidebarTab = 'assistant' | 'agent'

export interface ToolCall {
    tool_name: string
    parameters: Record<string, unknown>
}

interface MessageBase {
    role: 'user' | 'assistant'
    content: string
}

export interface AssistantMessage extends MessageBase {
    tool_calls?: ToolCall[]
}

export interface Agent {
    id: string
    name: string
}

export interface Tool {
    id: string
    name: string
    description: string
    parameters: Record<string, unknown>
}
