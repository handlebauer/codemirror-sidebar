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
    '--cm-ext-assistant-border-focus': string

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
    '--cm-ext-assistant-border-focus': 'rgba(255, 255, 255, 0.3)',

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
        '&': {
            // Apply all theme variables to the root
            ...Object.entries(assistantThemeVariables).reduce(
                (acc, [key, value]) => ({
                    ...acc,
                    [key]: value,
                }),
                {},
            ),
        },

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
            alignItems: 'flex-end',
            height: '36px',
            borderBottom: '1px solid var(--cm-ext-assistant-border)',
        },
        '.cm-ext-assistant-tab': {
            background: 'none',
            border: 'none',
            padding: '8px 10px',
            height: '35px',
            fontSize: 'var(--cm-ext-assistant-font-size)',
            fontWeight: '500',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            color: 'var(--cm-ext-assistant-text)',
            opacity: '0.7',
            transition: 'opacity 0.2s',
            position: 'relative',
            boxSizing: 'border-box',
            '&.cm-ext-assistant-tab-active': {
                background: 'var(--cm-ext-assistant-bg-selected)',
                opacity: '1',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-1px',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'var(--cm-ext-assistant-bg-selected)',
                },
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
                width: '98%',
                maxWidth: '98%',
                background: 'var(--cm-ext-assistant-bg-message)',
                color: 'var(--cm-ext-assistant-text)',
            },
        },
        '.cm-ext-assistant-message-content': {
            whiteSpace: 'pre-wrap',
            lineHeight: '1.2',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            width: '100%',
            boxSizing: 'border-box',
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
                transition: 'border-color 0.2s ease',
                '&:focus': {
                    borderColor: 'var(--cm-ext-assistant-border-focus)',
                },
            },
        },

        // Settings
        '.cm-ext-assistant-settings': {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box',
            padding: '12px 12px 6px 12px',
        },
        '.cm-ext-assistant-settings-description': {
            fontSize: '12px',
            marginTop: '12px',
            marginBottom: '16px',
            color: 'var(--cm-text-color, #e1e1e3)',
            opacity: '0.7',
        },
        '.cm-ext-assistant-settings-inputs': {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
        },
        '.cm-ext-assistant-settings-input': {
            display: 'flex',
            gap: '8px',
            padding: '8px',
            borderRadius: '6px',
            height: '49px',
            boxSizing: 'border-box',
            '& input': {
                flex: '1',
                background: 'var(--cm-input-bg, rgba(0, 0, 0, 0.2))',
                border: '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--cm-text-color, #e1e1e3)',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
            },
        },

        // Controls and Model Select
        '.cm-ext-assistant-controls': {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        '.cm-ext-assistant-model-select': {
            background: 'transparent',
            border: 'transparent',
            borderRadius: '4px',
            color: 'var(--cm-ext-assistant-text)',
            padding: '4px 24px 4px 8px',
            fontSize: 'var(--cm-ext-assistant-font-size)',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage:
                'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2014%2014%22%3E%3Cpath%20fill%3D%22%23e1e1e3%22%20d%3D%22M7%2010L3.5%206h7L7%2010z%22%2F%3E%3C%2Fsvg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 4px center',
            textAlign: 'right',
            direction: 'rtl',
        },

        // Loading States
        '.cm-ext-assistant-loading': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 0',
            alignSelf: 'flex-start',
            opacity: '0.7',
        },
        '.cm-ext-assistant-spinner': {
            width: '12px',
            height: '12px',
            border: '1.5px solid var(--cm-ext-assistant-border)',
            borderTop: '1.5px solid var(--cm-ext-assistant-text)',
            borderRadius: '50%',
            animation: 'cm-spin 0.8s linear infinite',
        },
        '.cm-ext-assistant-header-spinner': {
            marginLeft: 'auto',
            width: '8px',
            height: '8px',
            border: '1.5px solid transparent',
            borderTopColor: 'currentColor',
            borderRightColor: 'currentColor',
            borderRadius: '50%',
            animation: 'cm-spin 0.8s linear infinite',
        },

        // Code Block Enhancements
        '.cm-ext-assistant-code-copy': {
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            color: 'inherit',
            opacity: '0.5',
            transition: 'opacity 0.2s',
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '16px',
            '&:hover': {
                opacity: '0.8',
            },
        },
        '.cm-ext-assistant-code-incomplete': {
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60px',
            color: 'var(--cm-ext-assistant-text-secondary)',
            fontFamily: 'var(--cm-ext-assistant-font-mono)',
            fontSize: 'var(--cm-ext-assistant-font-size)',
            background: 'var(--cm-ext-assistant-bg-code)',
            borderTop: '1px solid var(--cm-ext-assistant-border)',
        },
        '.cm-ext-assistant-inline-code': {
            background: 'var(--cm-ext-assistant-bg-code)',
            padding: '1px 4px',
            borderRadius: '3px',
            fontFamily: 'var(--cm-ext-assistant-font-mono)',
            fontSize: 'calc(var(--cm-ext-assistant-font-size) - 1px)',
            display: 'inline',
            whiteSpace: 'pre',
            color: 'var(--cm-ext-assistant-text)',
        },

        // Loading Dots
        '.cm-ext-assistant-loading-dots': {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            marginLeft: 'auto',
            opacity: '0.5',
            height: '16px',
        },
        '.cm-ext-assistant-loading-dot': {
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            transition: 'background-color 0.15s ease',
            '&.filled': {
                backgroundColor: 'currentColor',
            },
            '&.empty': {
                backgroundColor: 'var(--cm-ext-assistant-border)',
            },
        },

        // Provider Styles
        '.cm-ext-assistant-provider': {
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            padding: '2px',
            background: 'var(--cm-input-bg, rgba(255, 255, 255, 0.03))',
            borderRadius: '4px',
        },
        '.cm-ext-assistant-provider-header': {
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--cm-text-color, #e1e1e3)',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            boxSizing: 'border-box',
        },
        '.cm-ext-assistant-provider-message': {
            fontSize: '13px',
            color: 'var(--cm-text-color, #e1e1e3)',
            opacity: '0.8',
            padding: '4px 12px',
            display: 'none',
            alignItems: 'center',
            borderRadius: '4px',
            height: '49px',
            boxSizing: 'border-box',
            gap: '8px',
            '&.has-api-key': {
                display: 'flex',
            },
            '& .checkmark': {
                color: '#4caf50',
            },
            '& .cm-ext-assistant-settings-button': {
                marginLeft: 'auto',
                padding: '8px',
                height: '100%',
                alignSelf: 'center',
                opacity: '0.5',
                '&:hover': {
                    opacity: '0.8',
                },
            },
        },
        '.cm-ext-assistant-provider-input': {
            display: 'flex',
            gap: '8px',
            padding: '8px',
            borderRadius: '6px',
            height: '49px',
            boxSizing: 'border-box',
            '&.has-api-key': {
                display: 'none',
            },
            '& input': {
                flex: '1',
                background: 'var(--cm-input-bg, rgba(0, 0, 0, 0.2))',
                border: '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '13px',
                color: 'var(--cm-text-color, #e1e1e3)',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
            },
        },

        // Animation keyframes
        '@keyframes cm-spin': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' },
        },

        // Additional UI Elements
        '.cm-ext-assistant-settings-button': {
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
            '.cm-ext-assistant-provider-input &': {
                marginLeft: '8px',
                padding: '8px',
                height: '100%',
                alignSelf: 'center',
                opacity: '0.5',
                '&:hover': {
                    opacity: '0.8',
                },
            },
        },
        '.cm-ext-assistant-header-border': {
            height: '1px',
            background: 'var(--cm-ext-assistant-border)',
            margin: '-2px 0 12px',
        },
        '.cm-ext-assistant-tabs-group': {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
        },

        // Code Block Editor Theme
        '.cm-ext-assistant-code-editor': {
            backgroundColor: 'transparent !important',
            height: 'auto !important',
            flex: 'initial !important',
            position: 'static !important',
        },
        '.cm-ext-assistant-code-editor .cm-content': {
            padding: '16px !important',
            height: 'auto !important',
            fontFamily: 'var(--cm-ext-assistant-font-mono) !important',
            fontSize: 'var(--cm-ext-assistant-font-size) !important',
            lineHeight: '1.5 !important',
        },
        '.cm-ext-assistant-code-editor .cm-line': {
            padding: '0 !important',
        },
        '.cm-ext-assistant-code-editor .cm-scroller': {
            height: 'auto !important',
            flex: 'initial !important',
            width: '100% !important',
        },
    }),
}
