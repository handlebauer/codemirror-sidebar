import { EditorView } from '@codemirror/view'
import type { ExtensionTheme } from './base'

/**
 * CSS Variables interface for customizing the file explorer's appearance.
 * These variables can be overridden by users to customize the look and feel.
 *
 * @example
 * ```ts
 * createCompleteTheme({
 *   variables: {
 *     '--cm-ext-explorer-text': '#e1e1e3',
 *     '--cm-ext-explorer-bg-hover': 'rgba(255, 255, 255, 0.05)',
 *   }
 * })
 * ```
 */
export interface ExplorerThemeVariables {
    // Colors
    '--cm-ext-explorer-text': string
    '--cm-ext-explorer-text-header': string
    '--cm-ext-explorer-border': string
    '--cm-ext-explorer-bg-hover': string
    '--cm-ext-explorer-bg-selected': string
    '--cm-ext-explorer-border-selected': string

    // Typography
    '--cm-ext-explorer-font-size': string
    '--cm-ext-explorer-font-weight': string
    '--cm-ext-explorer-header-font-size': string
    '--cm-ext-explorer-header-font-weight': string
    '--cm-ext-explorer-header-letter-spacing': string
}

// Default explorer theme variables
export const explorerThemeVariables: ExplorerThemeVariables = {
    // Colors
    '--cm-ext-explorer-text': 'rgb(197, 197, 199)',
    '--cm-ext-explorer-text-header': '#b1b1b3',
    '--cm-ext-explorer-border': '#2c313a',
    '--cm-ext-explorer-bg-hover': 'rgba(255, 255, 255, 0.05)',
    '--cm-ext-explorer-bg-selected': 'rgba(255, 255, 255, 0.05)',
    '--cm-ext-explorer-border-selected': 'rgba(255, 255, 255, 0.1)',

    // Typography
    '--cm-ext-explorer-header-font-size': '11px',
    '--cm-ext-explorer-header-font-weight': '800',
    '--cm-ext-explorer-header-letter-spacing': '0.5px',
    '--cm-ext-explorer-font-size': '12px',
    '--cm-ext-explorer-font-weight': '500',
}

/**
 * Explorer theme configuration.
 *
 * Public CSS Classes for Styling:
 * - .cm-ext-explorer-content: Main container of the file explorer
 * - .cm-ext-explorer-list: List container for files/directories
 * - .cm-ext-explorer-item: Individual file/directory items
 * - .cm-ext-explorer-caret: Directory expand/collapse carets
 *
 * Each of these classes can be styled using the CSS variables defined in ExplorerThemeVariables.
 */
export const explorerTheme: ExtensionTheme = {
    theme: EditorView.theme({
        '&': {
            height: '100vh',
            display: 'flex !important',
            flexDirection: 'row !important',
            position: 'relative',
            // Apply all theme variables to the root
            ...Object.entries(explorerThemeVariables).reduce(
                (acc, [key, value]) => ({
                    ...acc,
                    [key]: value,
                }),
                {},
            ),
        },

        '.cm-ext-explorer-content': {
            height: '100%',
            overflowY: 'auto',
        },

        '.cm-ext-explorer-list': {
            listStyle: 'none',
            padding: '0',
            margin: '0',
        },

        '.cm-ext-explorer-item': {
            border: '1px solid var(--cm-ext-explorer-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '2.5px 8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            color: 'var(--cm-ext-explorer-text)',
            fontSize: 'var(--cm-ext-explorer-font-size)',
            fontWeight: 'var(--cm-ext-explorer-font-weight)',

            '&:hover': {
                backgroundColor: 'var(--cm-ext-explorer-bg-hover)',
            },

            '&.cm-ext-explorer-item-selected': {
                backgroundColor: 'var(--cm-ext-explorer-bg-selected)',
                border: '1px solid var(--cm-ext-explorer-border-selected)',
            },
        },

        '.cm-ext-explorer-directory-item': {
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
        },

        '.cm-ext-explorer-caret': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '12px',
            lineHeight: '12px',
            transform: 'rotate(0deg) translateY(-1.5px)',
            textAlign: 'center',
            userSelect: 'none',
            fontSize: '18px',
            opacity: '0.6',
            transition: 'transform 0.15s ease',
            flexShrink: 0,

            '&.cm-ext-explorer-caret-expanded': {
                transform: 'rotate(90deg)',
            },
        },

        'h3.cm-ext-explorer-header': {
            userSelect: 'none',
            textTransform: 'uppercase',
            fontSize: 'var(--cm-ext-explorer-header-font-size)',
            fontWeight: 'var(--cm-ext-explorer-header-font-weight)',
            margin: '0',
            padding: '4px 8px 3px 10px',
            letterSpacing: 'var(--cm-ext-explorer-header-letter-spacing)',
            color: 'var(--cm-ext-explorer-text-header)',
        },

        '.cm-ext-explorer-directory span': {
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            marginLeft: '16px',
        },

        '.cm-ext-explorer-file': {
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none',
        },

        '.cm-ext-explorer-file-item': {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
        },

        '.cm-ext-explorer-icon': {
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
    }),
}
