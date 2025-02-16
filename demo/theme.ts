import { EditorView } from '@codemirror/view'

export const demoTheme = EditorView.theme(
    {
        '&': {
            backgroundColor: '#282a36',
            color: '#f8f8f2',
            height: '100%',
        },
        '.cm-content': {
            caretColor: '#ff79c6',
            fontFamily: 'monospace',
        },
        '.cm-cursor, .cm-dropCursor': {
            borderLeftColor: '#ff79c6',
        },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
            backgroundColor: '#44475a',
        },
        '.cm-activeLine': {
            backgroundColor: '#343746',
        },
        '.cm-gutters': {
            backgroundColor: '#21222c',
            color: '#6272a4',
            border: 'none',
        },
        '.cm-activeLineGutter': {
            backgroundColor: '#343746',
            color: '#f8f8f2',
        },
    },
    { dark: true },
)
