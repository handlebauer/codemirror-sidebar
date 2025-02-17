import { StateField, StateEffect, EditorState } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import { EditorView, Decoration, WidgetType } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { LanguageSupport } from '@codemirror/language'
import { markdown } from '@codemirror/lang-markdown'

// Interface for storing code block information
interface CodeBlockInfo {
    from: number
    to: number
    language: string | null
    code: string
}

// Function to determine language support based on string
const getLanguageSupport = (lang: string): LanguageSupport | null => {
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

// Widget for rendering code blocks
class CodeBlockWidget extends WidgetType {
    private view: EditorView | null = null

    // Inline styles for code blocks
    private static readonly styles = {
        wrapper: {
            border: '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
            borderRadius: '8px',
            margin: '8px 0',
            overflow: 'hidden',
            backgroundColor: '#1e1e1e',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
        header: {
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background:
                'linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))',
            color: 'var(--cm-text-secondary, rgba(255, 255, 255, 0.6))',
            fontSize: '11px',
            fontFamily:
                'var(--cm-font-family-mono, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace)',
            textTransform: 'lowercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            userSelect: 'none',
        },
        content: {
            padding: '16px',
        },
    }

    constructor(
        readonly code: string,
        readonly language: string | null,
    ) {
        super()
    }

    eq(other: CodeBlockWidget): boolean {
        return this.code === other.code && this.language === other.language
    }

    destroy() {
        this.view?.destroy()
    }

    toDOM(): HTMLElement {
        const wrapper = document.createElement('div')
        Object.assign(wrapper.style, CodeBlockWidget.styles.wrapper)
        wrapper.className = 'cm-ai-codeblock'

        // Create header with language badge if language is specified
        if (this.language) {
            const header = document.createElement('div')
            Object.assign(header.style, CodeBlockWidget.styles.header)
            header.className = 'cm-ai-codeblock-header'

            // Add a dot icon before the language name
            const dot = document.createElement('span')
            dot.textContent = '●'
            dot.style.fontSize = '8px'
            dot.style.opacity = '0.5'
            header.appendChild(dot)

            const langText = document.createElement('span')
            langText.textContent = this.language
            header.appendChild(langText)

            wrapper.appendChild(header)
        }

        // Create the nested editor
        const editorContainer = document.createElement('div')
        Object.assign(editorContainer.style, CodeBlockWidget.styles.content)
        editorContainer.className = 'cm-ai-codeblock-content'

        const languageSupport = this.language
            ? getLanguageSupport(this.language)
            : null
        const extensions: Extension[] = [
            EditorView.editable.of(false),
            EditorView.lineWrapping,
            EditorState.readOnly.of(true),
            EditorView.theme({
                '&': {
                    backgroundColor: 'transparent !important',
                },
                '.cm-content': {
                    padding: '0 !important',
                    fontFamily:
                        'var(--cm-font-family-mono, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace) !important',
                    fontSize: '13px !important',
                    lineHeight: '1.5 !important',
                },
                '.cm-line': {
                    padding: '0 !important',
                },
                '.cm-scroller': {
                    height: 'auto !important',
                    flex: 'initial !important',
                    width: '100% !important',
                },
            }),
        ]

        if (languageSupport) {
            extensions.push(languageSupport)
        }

        this.view = new EditorView({
            state: EditorState.create({
                doc: this.code,
                extensions,
            }),
            parent: editorContainer,
        })

        wrapper.appendChild(editorContainer)
        return wrapper
    }
}

// Effect for updating code blocks
const addCodeBlock = StateEffect.define<CodeBlockInfo>()
const removeCodeBlocks = StateEffect.define<null>()

// State field to track code blocks and their decorations
const codeBlockState = StateField.define<DecorationSet>({
    create() {
        return Decoration.none
    },
    update(decorations, tr) {
        decorations = decorations.map(tr.changes)

        for (const effect of tr.effects) {
            if (effect.is(addCodeBlock)) {
                const { from, to, code, language } = effect.value
                const widget = new CodeBlockWidget(code, language)
                const deco = Decoration.replace({
                    widget,
                    inclusive: true,
                    block: true,
                })
                decorations = decorations.update({
                    add: [{ from, to, value: deco }],
                    filter: (from, to) =>
                        from >= effect.value.to || to <= effect.value.from,
                })
            } else if (effect.is(removeCodeBlocks)) {
                decorations = Decoration.none
            }
        }
        return decorations
    },
    provide: f => EditorView.decorations.from(f),
})

// Helper function to parse code blocks from markdown text
const parseCodeBlocks = (text: string): CodeBlockInfo[] => {
    const codeBlocks: CodeBlockInfo[] = []
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)\n```/g
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
        codeBlocks.push({
            from: match.index,
            to: match.index + match[0].length,
            language: match[1] || null,
            code: match[2],
        })
    }

    return codeBlocks
}

// Main extension export
export const aiCodeBlockExtension = [codeBlockState]

// Export helper functions and types
export { addCodeBlock, removeCodeBlocks, parseCodeBlocks }
export type { CodeBlockInfo }
