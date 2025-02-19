import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'

// Theme interface that extensions can implement
export interface ExtensionTheme {
    theme: Extension
    darkTheme?: Extension
    lightTheme?: Extension
}

// Base theme that provides core styling
export const baseTheme = EditorView.theme({
    '&': {
        height: '100vh',
        display: 'flex !important',
        flexDirection: 'row !important',
        position: 'relative',
    },
    '.cm-scroller': {
        background: 'var(--cm-editor-background, #23272d)',
        overflowY: 'scroll',
        overflowX: 'auto',
        flex: '1 1 auto !important',
        minWidth: '0 !important',
        position: 'relative',
        marginRight: 'var(--assistant-width, 0px)',
        '&::-webkit-scrollbar': {
            width: '20px',
            height: '14px',
        },
        '&::-webkit-scrollbar-track': {
            background: 'var(--cm-scrollbar-track, rgba(35, 39, 45, 1))',
        },
        '&::-webkit-scrollbar-thumb': {
            background: 'var(--cm-scrollbar-thumb, rgba(69, 74, 81, 0.5))',
            borderRadius: '0',
            border: '3px solid var(--cm-editor-background, #23272d)',
        },
        '&::-webkit-scrollbar-thumb:hover': {
            background: 'var(--cm-scrollbar-thumb-hover, #555b63)',
        },
        '&:after': {
            content: '""',
            position: 'absolute',
            top: 0,
            height: 'calc(100% + 20%)',
            width: '1px',
            visibility: 'hidden',
        },
    },
    '.cm-content': {
        minHeight: '100%',
        caretColor: 'var(--cm-caret-color, #fff)',
        fontFamily: 'var(--cm-font-family, monospace)',
    },
    '.cm-gutter': {
        background: 'var(--cm-gutter-background, #23272d)',
        width: '30px',
        color: 'var(--cm-gutter-color, #636363)',
    },
})

// Sidebar base theme
export const sidebarBaseTheme = EditorView.theme({
    '.cm-sidebar-panel-container': {
        background: 'var(--cm-sidebar-background, #1e2227)',
        color: 'var(--cm-sidebar-text, #b1b1b3)',
    },
    '.cm-sidebar-panel-container[data-dock="left"]': {
        borderRight:
            'var(--cm-sidebar-border, 0.5px solid rgba(255, 255, 255, 0.2))',
    },
    '.cm-sidebar-panel-container[data-dock="right"]': {
        borderLeft:
            'var(--cm-sidebar-border, 0.5px solid rgba(255, 255, 255, 0.2))',
    },
    '.cm-sidebar-resize-handle': {
        cursor: 'col-resize',
        transition: 'none',
        backgroundColor: 'transparent',
        '&:hover': {
            backgroundColor:
                'var(--cm-resize-handle-hover, rgba(255, 255, 255, 0.1))',
            transitionProperty: 'background-color',
            transitionDuration: '0.2s',
            transitionTimingFunction: 'ease',
            transitionDelay: '150ms',
        },
        '&:active': {
            backgroundColor:
                'var(--cm-resize-handle-active, rgba(255, 255, 255, 0.1))',
            transition: 'none',
        },
    },
})

// CSS Variables interface for type safety
export interface ThemeVariables {
    // Editor
    '--cm-editor-background': string
    '--cm-caret-color': string
    '--cm-font-family': string

    // Scrollbar
    '--cm-scrollbar-track': string
    '--cm-scrollbar-thumb': string
    '--cm-scrollbar-thumb-hover': string

    // Gutter
    '--cm-gutter-background': string
    '--cm-gutter-color': string

    // Sidebar
    '--cm-sidebar-background': string
    '--cm-sidebar-text': string
    '--cm-sidebar-border': string
    '--cm-resize-handle-hover': string
    '--cm-resize-handle-active': string

    // Assistant
    '--assistant-width'?: string
}

// Default dark theme variables
export const darkThemeVariables: ThemeVariables = {
    '--cm-editor-background': '#23272d',
    '--cm-caret-color': '#fff',
    '--cm-font-family': 'monospace',

    '--cm-scrollbar-track': 'rgba(35, 39, 45, 1)',
    '--cm-scrollbar-thumb': 'rgba(69, 74, 81, 0.5)',
    '--cm-scrollbar-thumb-hover': '#555b63',

    '--cm-gutter-background': '#23272d',
    '--cm-gutter-color': '#636363',

    '--cm-sidebar-background': '#1e2227',
    '--cm-sidebar-text': '#b1b1b3',
    '--cm-sidebar-border': '0.5px solid rgba(255, 255, 255, 0.2)',
    '--cm-resize-handle-hover': 'rgba(255, 255, 255, 0.1)',
    '--cm-resize-handle-active': 'rgba(255, 255, 255, 0.1)',

    '--assistant-width': '0px',
}

// Helper to create a theme with variables
export function createTheme(variables: Partial<ThemeVariables>): Extension {
    return EditorView.theme({
        '&': Object.entries(variables).reduce(
            (acc, [key, value]) => ({
                ...acc,
                [key]: value,
            }),
            {},
        ),
    })
}
