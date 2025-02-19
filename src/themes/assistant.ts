import { EditorView } from '@codemirror/view'
import type { ExtensionTheme } from './base'

/**
 * CSS Variables interface for customizing the assistant panel's appearance.
 * These variables can be overridden by users to customize the look and feel.
 *
 * @example
 * ```ts
 * createCompleteTheme({
 *   variables: {
 *     '--cm-ext-assistant-text': '#ffffff',
 *     '--cm-ext-assistant-bg-message': 'rgba(255, 255, 255, 0.1)',
 *   }
 * })
 * ```
 */
export interface AssistantThemeVariables {
    // Colors
    '--cm-ext-assistant-text': string
    '--cm-ext-assistant-text-secondary': string
    '--cm-ext-assistant-border': string
    '--cm-ext-assistant-bg-input': string
    '--cm-ext-assistant-bg-message': string
    '--cm-ext-assistant-bg-selected': string
    '--cm-ext-assistant-accent': string
    '--cm-ext-assistant-bg-code': string

    // Typography
    '--cm-ext-assistant-font': string
    '--cm-ext-assistant-font-mono': string
    '--cm-ext-assistant-font-size': string
    '--cm-ext-assistant-line-height': string
    '--cm-ext-assistant-font-size-header': string
    '--cm-ext-assistant-font-weight-header': string
    '--cm-ext-assistant-font-size-message': string
}

// Default assistant theme variables
export const assistantThemeVariables: AssistantThemeVariables = {
    // Colors
    '--cm-ext-assistant-text': '#e1e1e3',
    '--cm-ext-assistant-text-secondary': 'rgba(255, 255, 255, 0.6)',
    '--cm-ext-assistant-border': 'rgba(255, 255, 255, 0.1)',
    '--cm-ext-assistant-bg-input': 'rgba(255, 255, 255, 0.05)',
    '--cm-ext-assistant-bg-message': 'rgba(255, 255, 255, 0.05)',
    '--cm-ext-assistant-bg-selected': 'rgba(255, 255, 255, 0.03)',
    '--cm-ext-assistant-accent': 'rgba(74, 158, 255, 0.2)',
    '--cm-ext-assistant-bg-code': '#1e1e1e',

    // Typography
    '--cm-ext-assistant-font': 'system-ui, -apple-system, sans-serif',
    '--cm-ext-assistant-font-mono':
        'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
    '--cm-ext-assistant-font-size': '13px',
    '--cm-ext-assistant-line-height': '1.4',
    '--cm-ext-assistant-font-size-header': '13px',
    '--cm-ext-assistant-font-weight-header': '500',
    '--cm-ext-assistant-font-size-message': '13px',
}

/**
 * Assistant theme configuration.
 *
 * Public CSS Classes for Styling:
 * - .cm-ext-assistant-container: Main container of the assistant panel
 * - .cm-ext-assistant-tab: Individual tab buttons
 * - .cm-ext-assistant-message: Message bubbles in the chat
 * - .cm-ext-assistant-code: Code block containers
 * - .cm-ext-assistant-input: Input area container
 *
 * Each of these classes can be styled using the CSS variables defined in AssistantThemeVariables.
 */
export const assistantTheme: ExtensionTheme = {
    theme: EditorView.theme({
        '.cm-ext-assistant-container': {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box',
            padding: '12px 12px 6px 12px',
            color: 'var(--cm-ext-assistant-text)',
            fontFamily: 'var(--cm-ext-assistant-font)',
            fontSize: 'var(--cm-ext-assistant-font-size)',
            lineHeight: 'var(--cm-ext-assistant-line-height)',
        },

        // Tabs
        '.cm-ext-assistant-tabs': {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '37px',
            borderBottom: '1px solid var(--cm-ext-assistant-border)',
            marginBottom: '12px',
        },
        '.cm-ext-assistant-tab': {
            background: 'none',
            border: 'none',
            padding: '6px 10px',
            fontSize: 'var(--cm-ext-assistant-font-size-header)',
            fontWeight: 'var(--cm-ext-assistant-font-weight-header)',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            color: 'var(--cm-ext-assistant-text)',
            opacity: '0.7',
            transition: 'opacity 0.2s',
            marginBottom: '-1px',
            '&.cm-ext-assistant-tab-active': {
                background: 'var(--cm-ext-assistant-bg-selected)',
                opacity: '1',
                borderBottom: '1px solid var(--cm-ext-assistant-bg-selected)',
            },
        },

        // Messages
        '.cm-ext-assistant-messages': {
            flex: '1',
            overflowY: 'auto',
            padding: '8px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        '.cm-ext-assistant-message': {
            maxWidth: '85%',
            padding: '8px 10px',
            borderRadius: '12px',
            fontSize: 'var(--cm-ext-assistant-font-size-message)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            '&.cm-ext-assistant-message-user': {
                alignSelf: 'flex-end',
                background: 'var(--cm-ext-assistant-accent)',
                color: 'var(--cm-ext-assistant-text)',
            },
            '&.cm-ext-assistant-message-bot': {
                alignSelf: 'flex-start',
                background: 'var(--cm-ext-assistant-bg-message)',
                color: 'var(--cm-ext-assistant-text)',
            },
        },

        // Code blocks
        '.cm-ext-assistant-code': {
            margin: '0',
            position: 'relative',
            border: '1px solid var(--cm-ext-assistant-border)',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'var(--cm-ext-assistant-bg-code)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        },
        '.cm-ext-assistant-code-header': {
            padding: '8px 12px',
            borderBottom: '1px solid var(--cm-ext-assistant-border)',
            background:
                'linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))',
            color: 'var(--cm-ext-assistant-text-secondary)',
            fontSize: '11px',
            fontFamily: 'var(--cm-ext-assistant-font-mono)',
            textTransform: 'lowercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            userSelect: 'none',
            height: '37px',
            boxSizing: 'border-box',
        },

        // Input
        '.cm-ext-assistant-input': {
            borderTop: '1px solid var(--cm-ext-assistant-border)',
            padding: '12px 12px 6px 12px',
            width: '100%',
            boxSizing: 'border-box',
            '& textarea': {
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--cm-ext-assistant-bg-input)',
                border: '1px solid var(--cm-ext-assistant-border)',
                borderRadius: '4px',
                color: 'var(--cm-ext-assistant-text)',
                padding: '8px 12px',
                fontSize: 'var(--cm-ext-assistant-font-size)',
                lineHeight: 'var(--cm-ext-assistant-line-height)',
                resize: 'none',
                outline: 'none',
                '&:focus': {
                    borderColor: 'var(--cm-ext-assistant-accent)',
                },
            },
        },

        // Settings
        '.cm-ext-assistant-settings': {
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            '& select': {
                background: 'transparent',
                border: 'transparent',
                borderRadius: '4px',
                color: 'var(--cm-ext-assistant-text)',
                padding: '4px 24px 4px 8px',
                fontSize: 'var(--cm-ext-assistant-font-size)',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
            },
            '& button': {
                background: 'none',
                border: 'none',
                padding: '6px 8px',
                fontSize: 'var(--cm-ext-assistant-font-size)',
                cursor: 'pointer',
                opacity: '0.7',
                transition: 'opacity 0.2s',
                color: 'var(--cm-ext-assistant-text)',
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                    opacity: '1',
                },
            },
        },
    }),
}
