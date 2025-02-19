import { StateField, StateEffect, EditorState } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import { EditorView, Decoration, WidgetType } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { LanguageSupport } from '@codemirror/language'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

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
    private static chunkCounter = 0

    constructor(
        readonly code: string,
        readonly language: string | null,
        readonly isIncomplete: boolean = false,
    ) {
        super()
    }

    eq(other: CodeBlockWidget): boolean {
        return (
            this.code === other.code &&
            this.language === other.language &&
            this.isIncomplete === other.isIncomplete
        )
    }

    destroy() {
        this.view?.destroy()
    }

    toDOM(): HTMLElement {
        const wrapper = document.createElement('div')
        wrapper.className = 'cm-ext-assistant-code'

        // Create header with language badge if language is specified
        if (this.language) {
            const header = document.createElement('div')
            header.className = 'cm-ext-assistant-code-header'

            // Add a dot icon before the language name
            const dot = document.createElement('span')
            dot.textContent = '●'
            dot.style.marginRight = '6px'
            header.appendChild(dot)

            const langText = document.createElement('span')
            langText.textContent = this.language
            header.appendChild(langText)

            // Add loading dots for incomplete blocks
            if (this.isIncomplete) {
                // Increment chunk counter and wrap around at 3
                CodeBlockWidget.chunkCounter =
                    (CodeBlockWidget.chunkCounter + 1) % 3

                const loadingDots = document.createElement('div')
                loadingDots.className = 'cm-ext-assistant-loading-dots'

                // Create three dots that fill in sequence based on chunk count
                for (let i = 0; i < 3; i++) {
                    const dot = document.createElement('div')
                    dot.className = `cm-ext-assistant-loading-dot ${i <= CodeBlockWidget.chunkCounter ? 'filled' : 'empty'}`
                    loadingDots.appendChild(dot)
                }

                header.appendChild(loadingDots)
            }

            // Add copy button (only for complete blocks)
            if (!this.isIncomplete) {
                const copyButton = document.createElement('button')
                copyButton.className = 'cm-ext-assistant-code-copy'
                copyButton.title = 'Copy code'
                copyButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>`

                copyButton.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(this.code)
                        const originalHTML = copyButton.innerHTML
                        copyButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 6L9 17l-5-5"></path>
                        </svg>`
                        setTimeout(() => {
                            copyButton.innerHTML = originalHTML
                        }, 2000)
                    } catch (err) {
                        console.error('Failed to copy code:', err)
                    }
                })

                header.appendChild(copyButton)
            }

            wrapper.appendChild(header)
        }

        // Only create editor container if we have complete content
        if (!this.isIncomplete) {
            const editorContainer = document.createElement('div')
            editorContainer.className = 'cm-ext-assistant-code-editor'

            const languageSupport = this.language
                ? getLanguageSupport(this.language)
                : null
            const extensions: Extension[] = [
                EditorView.editable.of(false),
                EditorView.lineWrapping,
                EditorState.readOnly.of(true),
                oneDark,
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
        }

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
export { addCodeBlock, removeCodeBlocks, parseCodeBlocks, CodeBlockWidget }
export type { CodeBlockInfo }
