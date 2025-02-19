import { EditorView } from '@codemirror/view'
import type { ExtensionTheme } from './base'

/**
 * CSS Variables interface for customizing the sidebar's appearance.
 * These variables can be overridden by users to customize the look and feel.
 *
 * @example
 * ```ts
 * createCompleteTheme({
 *   variables: {
 *     '--cm-ext-sidebar-bg': '#21222c',
 *     '--cm-ext-sidebar-border': 'rgba(255, 255, 255, 0.2)',
 *   }
 * })
 * ```
 */
export interface SidebarThemeVariables {
    // Colors
    '--cm-ext-sidebar-bg': string
    '--cm-ext-sidebar-border': string
    '--cm-ext-sidebar-resize-hover': string
    '--cm-ext-sidebar-resize-active': string

    // Dimensions
    '--cm-ext-sidebar-width': string
    '--cm-ext-sidebar-resize-handle-width': string
    '--cm-ext-sidebar-min-width': string
    '--cm-ext-sidebar-max-width': string
}

// Default sidebar theme variables
export const sidebarThemeVariables: SidebarThemeVariables = {
    // Colors
    '--cm-ext-sidebar-bg': '#21222c',
    '--cm-ext-sidebar-border': 'rgba(255, 255, 255, 0.2)',
    '--cm-ext-sidebar-resize-hover': 'rgba(255, 255, 255, 0.1)',
    '--cm-ext-sidebar-resize-active': 'rgba(255, 255, 255, 0.1)',

    // Dimensions
    '--cm-ext-sidebar-width': '250px',
    '--cm-ext-sidebar-resize-handle-width': '8px',
    '--cm-ext-sidebar-min-width': '150px',
    '--cm-ext-sidebar-max-width': '800px',
}

/**
 * Sidebar theme configuration.
 *
 * Public CSS Classes for Styling:
 * - .cm-ext-sidebar: Main container of the sidebar
 * - .cm-ext-sidebar-panel: Panel container within the sidebar
 * - .cm-ext-sidebar-resize: Resize handle for the sidebar
 *
 * Each of these classes can be styled using the CSS variables defined in SidebarThemeVariables.
 */
export const sidebarTheme: ExtensionTheme = {
    theme: EditorView.theme({
        // Editor container styles for proper sidebar layout
        '&': {
            height: '100vh',
            display: 'flex !important',
            flexDirection: 'row !important',
            position: 'relative',
            // Apply all theme variables to the root
            ...Object.entries(sidebarThemeVariables).reduce(
                (acc, [key, value]) => ({
                    ...acc,
                    [key]: value,
                }),
                {},
            ),
        },

        '.cm-ext-sidebar': {
            height: '100%',
            width: 'var(--cm-ext-sidebar-width)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: '0',
            transition: 'transform 0.2s ease-in-out',
            transform: 'translateX(0)',
            backgroundColor: 'var(--cm-ext-sidebar-bg)',
            position: 'relative',

            '&[data-overlay="true"]': {
                zIndex: '10',
                position: 'absolute',
                top: '0',
                height: '100%',
                '&[data-dock="left"]': {
                    left: '0',
                },
                '&[data-dock="right"]': {
                    right: '0',
                },
            },
            '&[data-overlay="false"]': {
                position: 'relative',
                zIndex: '1',
                overflow: 'hidden',
                flexShrink: '0',
                '&[data-dock="left"]': {
                    order: -1,
                },
                '&[data-dock="right"]': {
                    order: 1,
                },
            },
            '&[data-visible="false"]': {
                transform: 'translateX(100%)',
                display: 'none',
            },
        },

        '.cm-ext-sidebar-panel': {
            height: '100%',
            overflow: 'auto',
            backgroundColor: 'var(--cm-ext-sidebar-bg)',

            '&[data-dock="left"]': {
                borderRight: '0.5px solid var(--cm-ext-sidebar-border)',
            },
            '&[data-dock="right"]': {
                borderLeft: '0.5px solid var(--cm-ext-sidebar-border)',
            },
        },

        '.cm-ext-sidebar-resize': {
            position: 'absolute',
            top: '0',
            width: 'var(--cm-ext-sidebar-resize-handle-width)',
            height: '100%',
            cursor: 'col-resize',
            zIndex: '20',
            backgroundColor: 'transparent',
            transition: 'none',
        },

        '.cm-ext-sidebar-resize:hover': {
            backgroundColor: 'var(--cm-ext-sidebar-resize-hover)',
            transitionProperty: 'background-color',
            transitionDuration: '0.2s',
            transitionTimingFunction: 'ease',
            transitionDelay: '150ms',
        },

        '.cm-ext-sidebar-resize:active': {
            backgroundColor: 'var(--cm-ext-sidebar-resize-active)',
            transition: 'none',
        },

        '&.cm-ext-sidebar-dragging': {
            cursor: 'col-resize',
            userSelect: 'none',
        },

        // Editor content styles
        '.cm-scroller': {
            flex: '1 1 auto !important',
            minWidth: '0 !important',
            position: 'relative',
            overflow: 'auto',
        },
    }),
}
