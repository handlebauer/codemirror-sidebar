'use client'

import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup } from 'codemirror'
import { explorer, updateFilesEffect } from '../../../../src/explorer'
import { assistant } from '../../../../src/assistant'
import { demoFiles } from './data'

const useEditor = () => {
    const editorRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView>(null)

    useEffect(() => {
        if (!editorRef.current) return

        const state = EditorState.create({
            doc: 'Select a file from the explorer to begin editing',
            extensions: [
                basicSetup,
                javascript(),
                oneDark,
                explorer({
                    dock: 'left',
                    width: '250px',
                    keymap: { mac: 'Cmd-b', win: 'Ctrl-b' },
                    overlay: false,
                    backgroundColor: '#2c313a',
                }),
                assistant({
                    width: '400px',
                    backgroundColor: '#2c313a',
                    keymap: { mac: 'Cmd-r', win: 'Ctrl-r' },
                    model: 'gpt-4',
                }),
                EditorView.theme({
                    '&': { height: '100vh' },
                    '.cm-scroller': { overflow: 'auto' },
                }),
            ],
        })

        const view = new EditorView({
            state,
            parent: editorRef.current,
        })

        // Initialize with demo files
        view.dispatch({
            effects: updateFilesEffect.of(demoFiles),
        })

        viewRef.current = view

        return () => {
            view.destroy()
            viewRef.current = null
        }
    }, [])

    return { editorRef, viewRef }
}

export function Editor() {
    const { editorRef } = useEditor()

    return (
        <div className="w-full h-screen">
            <div ref={editorRef} className="h-full" />
        </div>
    )
}
