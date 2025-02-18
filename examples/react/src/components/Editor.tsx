'use client'

import { useEditor } from '../../../../src/hooks'
import { demoFiles } from './data'

export function Editor() {
    const { ref } = useEditor({
        initialContent: 'Select a file from the explorer to begin editing',
        explorer: {
            dock: 'left',
            width: '250px',
            keymap: { mac: 'Cmd-b', win: 'Ctrl-b' },
            overlay: false,
            backgroundColor: '#2c313a',
            initiallyOpen: true,
            initialFiles: demoFiles,
        },
        assistant: {
            width: '400px',
            backgroundColor: '#2c313a',
            keymap: { mac: 'Cmd-r', win: 'Ctrl-r' },
            model: 'gpt-4',
        },
    })

    return (
        <div className="w-full h-screen">
            <div ref={ref} className="h-full" />
        </div>
    )
}
