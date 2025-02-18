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
            '& h3': {
                color: 'var(--cm-sidebar-text)',
            },
        },
        '.cm-file-explorer-list': {
            listStyle: 'none',
        },
        '.cm-file-explorer-item': {
            cursor: 'pointer',
            '&:hover': {
                backgroundColor:
                    'var(--cm-sidebar-item-hover-background, rgba(255, 255, 255, 0.1))',
            },
        },
        '.cm-file-explorer-item-selected': {},
    },
    { dark: false },
)
