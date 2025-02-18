import { type Extension } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { explorer } from '../../../src/explorer'
import { assistant } from '../../../src/assistant'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'

export function createEditorExtensions(): Extension[] {
    return [
        basicSetup,
        oneDark,
        javascript(),
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
    ]
}
