import { type Extension } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { sidebarExtension, createAISidebar } from '../../../src'
import { oneDark } from '@codemirror/theme-one-dark'

export function createEditorExtensions(): Extension[] {
    return [
        basicSetup,
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
    ]
}
