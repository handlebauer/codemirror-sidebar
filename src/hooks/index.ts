import { useEffect, useRef } from 'react'
import { EditorState, type Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup } from 'codemirror'
import { explorer, updateFilesEffect } from '../explorer'
import { assistant } from '../assistant'
import { createCompleteTheme } from '../themes'
import type { File } from '../explorer'
import type { AssistantOptions } from '../assistant'
import type { ExplorerOptions } from '../explorer'
import { setProjectNameEffect } from '../explorer/state'

interface EditorConfig {
    /**
     * Initial content of the editor
     * @default ''
     */
    initialContent?: string
    /**
     * Configuration for the file explorer
     * @example { initiallyOpen: true, width: '250px', projectName: 'My Project' }
     */
    explorer?: ExplorerOptions & { initialFiles?: File[]; projectName?: string }
    /**
     * Configuration for the AI assistant
     * @example { initiallyOpen: true, width: '400px' }
     */
    assistant?: AssistantOptions
    /**
     * Additional CodeMirror extensions
     */
    extensions?: Extension[]
    /**
     * Theme configuration
     */
    theme?: {
        dark?: boolean
        variables?: Record<string, string>
    }
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
            theme = { dark: true },
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
                              projectName: explorerConfig.projectName,
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
                // Add theme
                ...createCompleteTheme(theme),
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

        // Initialize project name if provided
        if (explorerConfig?.projectName) {
            view.dispatch({
                effects: setProjectNameEffect.of(explorerConfig.projectName),
            })
        }

        // Focus the editor view after initialization
        view.focus()

        viewRef.current = view

        return () => {
            view.destroy()
            viewRef.current = null
        }
    }, [config])

    const updateProjectName = (projectName: string) => {
        if (!viewRef.current) return
        viewRef.current.dispatch({
            effects: setProjectNameEffect.of(projectName),
        })
    }

    return {
        ref: editorRef,
        view: viewRef.current,
        updateProjectName,
    }
}

// Re-export types that might be needed
export type { File, EditorConfig, AssistantOptions, ExplorerOptions }
