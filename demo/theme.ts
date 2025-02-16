// src/theme.ts

import { EditorView } from '@codemirror/view'

export const demoTheme = EditorView.theme(
    {
        '&': {
            backgroundColor: 'var(--cm-base-background-color)',
            color: 'var(--cm-base-text-color)',
            height: '100%',
        },
        '.cm-content': {
            caretColor: 'var(--cm-base-caret-color)',
            fontFamily: 'monospace',
        },
        '.cm-cursor, .cm-dropCursor': {
            borderLeftColor: 'var(--cm-base-caret-color)',
        },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
            backgroundColor: 'var(--cm-base-selection-background)',
        },
        '.cm-activeLine': {
            backgroundColor: 'var(--cm-base-active-line-background)',
        },
        '.cm-gutters': {
            backgroundColor: 'var(--cm-base-gutter-background)',
            color: 'var(--cm-base-gutter-color)',
            border: 'none',
        },
        '.cm-activeLineGutter': {
            backgroundColor: 'var(--cm-base-active-line-background)',
            color: 'var(--cm-base-text-color)',
        },
        '.cm-sidebar': {
            backgroundColor: 'var(--cm-sidebar-background)',
            color: 'var(--cm-sidebar-text)',
        },
        '.cm-sidebar-explorer-content': {
            padding: '8px',
            '& h3': {
                margin: '0 0 8px 0',
                fontSize: '1em',
                fontWeight: 'bold',
                color: 'var(--cm-sidebar-text)',
            },
        },
        '.cm-file-explorer-list': {
            listStyle: 'none',
            margin: 0,
            padding: 0,
        },
        '.cm-file-explorer-item': {
            padding: '4px 8px',
            cursor: 'pointer',
            borderRadius: '4px',
            '&:hover': {
                backgroundColor:
                    'var(--cm-sidebar-item-hover-background, rgba(255, 255, 255, 0.1))',
            },
        },
        '.cm-file-explorer-item-selected': {
            backgroundColor:
                'var(--cm-sidebar-item-selected-background, rgba(255, 255, 255, 0.15))',
            fontWeight: 'bold',
        },
    },
    { dark: true },
)
