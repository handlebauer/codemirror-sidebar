'use client'

import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup } from 'codemirror'
import {
    sidebarExtension,
    createAISidebar,
    toggleSidebarEffect,
} from '../../../../src'

const useEditor = () => {
    const editorRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView>(null)

    useEffect(() => {
        if (!editorRef.current) return

        const state = EditorState.create({
            doc: 'console.log("Hello from CodeMirror!")',
            extensions: [
                basicSetup,
                javascript(),
                oneDark,
                ...sidebarExtension({
                    sidebarOptions: {
                        id: 'file-explorer',
                        dock: 'left',
                        overlay: false,
                        width: '250px',
                        backgroundColor: '#2c313a',
                    },
                    toggleKeymaps: {
                        mac: 'Cmd-b',
                        win: 'Ctrl-b',
                    },
                }),
                ...createAISidebar({
                    width: '400px',
                    backgroundColor: '#2c313a',
                    toggleKeymaps: {
                        mac: 'Cmd-r',
                        win: 'Ctrl-r',
                    },
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

        // Show file explorer by default
        view.dispatch({
            effects: toggleSidebarEffect.of({
                id: 'file-explorer',
                visible: true,
            }),
        })

        viewRef.current = view

        return () => {
            view.destroy()
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
