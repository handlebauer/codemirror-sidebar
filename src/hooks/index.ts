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
                        background: '#23272d',
                        overflowY: 'scroll',
                        overflowX: 'auto',
                        flex: '1 1 auto !important',
                        minWidth: '0 !important',
                        position: 'relative',
                        '&::-webkit-scrollbar': {
                            width: '20px',
                            height: '14px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'rgba(35, 39, 45, 1)',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(69, 74, 81, 0.5)',
                            borderRadius: '0',
                            border: '3px solid #23272d',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: '#555b63',
                        },
                    },
                    '.cm-scroller::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        height: 'calc(100% + 20%)',
                        width: '1px',
                        visibility: 'hidden',
                    },
                    '.cm-content': {
                        minHeight: '100%',
                    },
                    '.cm-gutter': {
                        background: '#23272d',
                        width: '30px',
                    },
                    '.cm-sidebar-panel-container': {
                        background: '#1e2227',
                    },
                    '.cm-sidebar-panel-container[data-dock="left"]': {
                        borderRight: '0.5px solid rgba(255, 255, 255, 0.2)',
                    },
                    '.cm-sidebar-panel-container[data-dock="right"]': {
                        borderLeft: '0.5px solid rgba(255, 255, 255, 0.2)',
                    },
                    '.cm-sidebar-resize-handle': {
                        cursor: 'col-resize',
                        transition: 'none',
                        backgroundColor: 'transparent',
                    },
                    '.cm-sidebar-resize-handle:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transitionProperty: 'background-color',
                        transitionDuration: '0.2s',
                        transitionTimingFunction: 'ease',
                        transitionDelay: '150ms',
                    },
                    '.cm-sidebar-resize-handle:active': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transition: 'none',
                    },
                    '.cm-explorer-header': {
                        color: '#b1b1b3 !important',
                    },
                    '.cm-explorer-item': {
                        border: '1px solid #1e2227',
                        margin: 0,
                        padding: '3px 0',
                    },
                    '.cm-explorer-item:hover': {
                        border: '1px solid #2e3035',
                    },
                    '.cm-explorer-item.cm-explorer-item-selected': {
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    },
                    '.cm-sidebar-panel-container h3': {
                        color: '#fff',
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
