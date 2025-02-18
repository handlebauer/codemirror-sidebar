import { useEffect, useRef } from 'react'
import { EditorState, type Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup } from 'codemirror'
import { explorer, updateFilesEffect } from '../explorer'
import { assistant } from '../assistant'
import type { File } from '../explorer'
import type { AssistantOptions } from '../assistant'
import type { ExplorerOptions } from '../explorer'

interface EditorConfig {
    /**
     * Initial content of the editor
     * @default ''
     */
    initialContent?: string
    /**
     * Configuration for the file explorer
     * @example { initiallyOpen: true, width: '250px' }
     */
    explorer?: ExplorerOptions & { initialFiles?: File[] }
    /**
     * Configuration for the AI assistant
     * @example { initiallyOpen: true, width: '400px' }
     */
    assistant?: AssistantOptions
    /**
     * Additional CodeMirror extensions
     */
    extensions?: Extension[]
}

export function useEditor(config: EditorConfig = {}) {
    const editorRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)

    useEffect(() => {
        if (!editorRef.current) return

        const {
            initialContent = '',
            explorer: explorerConfig,
            assistant: assistantConfig,
            extensions = [],
        } = config

        const state = EditorState.create({
            doc: initialContent,
            extensions: [
                basicSetup,
                javascript(),
                oneDark,
                // Add explorer if configured
                ...(explorerConfig
                    ? [
                          explorer({
                              dock: 'left',
                              width: '250px',
                              overlay: false,
                              backgroundColor: '#2c313a',
                              initiallyOpen: false,
                              ...explorerConfig,
                          }),
                      ]
                    : []),
                // Add assistant if configured
                ...(assistantConfig
                    ? [
                          assistant({
                              width: '400px',
                              backgroundColor: '#2c313a',
                              initiallyOpen: false,
                              ...assistantConfig,
                          }),
                      ]
                    : []),
                // Add custom extensions
                ...extensions,
                EditorView.theme({
                    '&': {
                        height: '100vh',
                        display: 'flex !important',
                        flexDirection: 'row !important',
                    },
                    '.cm-scroller': {
                        overflow: 'auto',
                        flex: '1 1 auto !important',
                        minWidth: '0 !important',
                    },
                    '.cm-content': {
                        minHeight: '100%',
                    },
                }),
            ],
        })

        const view = new EditorView({
            state,
            parent: editorRef.current,
        })

        // Initialize with files if provided
        if (explorerConfig?.initialFiles) {
            view.dispatch({
                effects: updateFilesEffect.of(explorerConfig.initialFiles),
            })
        }

        viewRef.current = view

        return () => {
            view.destroy()
            viewRef.current = null
        }
    }, [config])

    return {
        ref: editorRef,
        view: viewRef.current,
    }
}

// Re-export types that might be needed
export type { File, EditorConfig, AssistantOptions, ExplorerOptions }
