import { type Extension } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { sidebarExtension, createAISidebar } from '../../src/index'

export function createEditorExtensions(): Extension[] {
    return [
        basicSetup,
        // File explorer sidebar on the left
        sidebarExtension({
            sidebarOptions: {
                dock: 'left',
                overlay: false,
                width: '250px',
                backgroundColor: '#2c313a',
                id: 'file-explorer',
            },
            toggleKeymaps: {
                mac: 'Cmd-b',
                win: 'Ctrl-b',
            },
        }),
        // AI assistant sidebar on the right
        createAISidebar({
            width: '400px',
            backgroundColor: '#2c313a',
            toggleKeymaps: {
                mac: 'Cmd-r',
                win: 'Ctrl-r',
            },
        }),
        oneDark,
    ]
}
