'use client'

import { useEditor } from '../../../../src/hooks'
import { demoFiles } from './data'

export function Editor() {
    const { ref } = useEditor({
        initialContent: '',
        explorer: {
            dock: 'left',
            width: '250px',
            keymap: { mac: 'Cmd-b', win: 'Ctrl-b' },
            overlay: false,
            backgroundColor: '#2c313a',
            initiallyOpen: true,
            initialFiles: demoFiles,
            onFileSelect: filename => {
                console.log('Selected file:', filename)
            },
        },
        assistant: {
            width: '400px',
            backgroundColor: '#2c313a',
            keymap: { mac: 'Cmd-r', win: 'Ctrl-r' },
        },
    })

    return (
        <div className="w-full h-screen">
            <div ref={ref} className="h-full" />
        </div>
    )
}
