import { StateField, StateEffect, EditorState } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import { EditorView, Decoration, WidgetType } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { LanguageSupport } from '@codemirror/language'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import crelt from 'crelt'
import * as styles from './styles'

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
        Object.assign(wrapper.style, styles.codeBlockWrapperStyles)
        wrapper.className = 'cm-ai-codeblock'

        // Create header with language badge if language is specified
        if (this.language) {
            const header = document.createElement('div')
            Object.assign(header.style, styles.codeBlockHeaderStyles)
            header.className = 'cm-ai-codeblock-header'

            // Add a dot icon before the language name
            const dot = document.createElement('span')
            dot.textContent = '●'
            Object.assign(dot.style, styles.dotStyles)
            header.appendChild(dot)

            const langText = document.createElement('span')
            langText.textContent = this.language
            header.appendChild(langText)

            wrapper.appendChild(header)
        }

        // Create the nested editor
        const editorContainer = document.createElement('div')
        Object.assign(editorContainer.style, styles.codeBlockContentStyles)
        editorContainer.className = 'cm-ai-codeblock-content'

        const languageSupport = this.language
            ? getLanguageSupport(this.language)
            : null
        const extensions: Extension[] = [
            EditorView.editable.of(false),
            EditorView.lineWrapping,
            EditorState.readOnly.of(true),
            oneDark,
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

// Keep track of chunk count to determine which dots to fill
let chunkCounter = 0

export function renderCodeBlock(
    segment: {
        type: 'code' | 'incomplete-code'
        content: string
        language?: string | null
    },
    container: HTMLElement,
) {
    const codeBlockContainer = crelt('div')
    Object.assign(codeBlockContainer.style, styles.codeBlockContainerStyles)

    // Add language header if present
    if (segment.language) {
        const header = crelt('div')
        Object.assign(header.style, styles.codeBlockHeaderStyles)

        const dot = crelt('span')
        dot.textContent = '●'
        Object.assign(dot.style, styles.dotStyles)
        header.appendChild(dot)

        const langText = crelt('span')
        langText.textContent = segment.language
        header.appendChild(langText)

        if (segment.type === 'incomplete-code') {
            // Increment chunk counter and wrap around at 3
            chunkCounter = (chunkCounter + 1) % 3

            const loadingDots = crelt('div')
            Object.assign(loadingDots.style, styles.loadingDotsStyles)

            // Create three dots that fill in sequence based on chunk count
            for (let i = 0; i < 3; i++) {
                const dot = crelt('div')
                // Fill dots up to the current chunk count
                Object.assign(
                    dot.style,
                    i <= chunkCounter
                        ? styles.loadingDotFilledStyles
                        : styles.loadingDotEmptyStyles,
                )
                loadingDots.appendChild(dot)
            }

            header.appendChild(loadingDots)
        }

        codeBlockContainer.appendChild(header)
    }

    if (segment.type === 'incomplete-code') {
        // Create loading container for incomplete code block
        const loadingContainer = crelt('div')
        Object.assign(
            loadingContainer.style,
            styles.incompleteCodeLoadingContainerStyles,
        )
        codeBlockContainer.appendChild(loadingContainer)
    } else {
        // Create code block editor for complete blocks
        new EditorView({
            state: EditorState.create({
                doc: segment.content,
                extensions: [
                    EditorView.editable.of(false),
                    EditorState.readOnly.of(true),
                    EditorView.lineWrapping,
                    oneDark,
                    segment.language
                        ? (getLanguageSupport(segment.language) ?? [])
                        : [],
                    styles.codeBlockEditorTheme,
                ],
            }),
            parent: codeBlockContainer,
        })
    }

    container.appendChild(codeBlockContainer)
}
