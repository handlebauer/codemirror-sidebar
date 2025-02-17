import { EditorView } from '@codemirror/view'

export const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    padding: '12px 12px 6px 12px',
}

export const tabsContainerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '32px',
}

export const tabsGroupStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
}

export const getTabStyles = (isActive: boolean) => ({
    background: isActive
        ? 'var(--cm-selected-bg, rgba(255, 255, 255, 0.05))'
        : 'none',
    border: 'none',
    padding: '6px 10px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '4px 4px 0 0',
    color: 'var(--cm-text-color, #cdc8d0)',
    opacity: isActive ? '1' : '0.7',
    transition: 'opacity 0.2s',
    marginBottom: '-1px',
    borderBottom: isActive
        ? '1px solid var(--cm-selected-bg, rgba(255, 255, 255, 0.05))'
        : 'none',
})

export const controlsContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
}

export const modelSelectStyles = {
    background: 'transparent',
    border: 'transparent',
    borderRadius: '4px',
    color: 'var(--cm-text-color, #cdc8d0)',
    padding: '4px 24px 4px 8px',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    backgroundImage:
        'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2014%2014%22%3E%3Cpath%20fill%3D%22%23cdc8d0%22%20d%3D%22M7%2010L3.5%206h7L7%2010z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 4px center',
    textAlign: 'right',
    direction: 'rtl',
}

export const settingsButtonStyles = {
    background: 'none',
    border: 'none',
    padding: '6px 8px',
    fontSize: '16px',
    cursor: 'pointer',
    opacity: '0.7',
    transition: 'opacity 0.2s',
}

export const headerBorderStyles = {
    height: '1px',
    background: 'var(--cm-border-color, rgba(255, 255, 255, 0.1))',
    margin: '-2px 0 12px',
}

export const messagesContainerStyles = {
    flex: '1',
    overflowY: 'auto',
    padding: '12px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}

export const inputContainerStyles = {
    borderTop: '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
    padding: '12px 12px 6px 12px',
    width: '100%',
    boxSizing: 'border-box',
}

export const textareaStyles = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--cm-input-bg, rgba(255, 255, 255, 0.05))',
    border: '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
    borderRadius: '4px',
    color: 'var(--cm-text-color, #cdc8d0)',
    padding: '8px 12px',
    fontSize: '13px',
    lineHeight: '1.4',
    resize: 'none',
    outline: 'none',
}

// Message styles
export const loadingContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 0',
    alignSelf: 'flex-start',
    opacity: '0.7',
}

export const spinnerStyles = {
    width: '12px',
    height: '12px',
    border: '1.5px solid var(--cm-border-color, rgba(255, 255, 255, 0.05))',
    borderTop: '1.5px solid var(--cm-text-color, #cdc8d0)',
    borderRadius: '50%',
    animation: 'cm-spin 0.8s linear infinite',
}

export const getMessageStyles = (isUser: boolean) => ({
    maxWidth: '85%',
    padding: '8px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    lineHeight: '1.4',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    background: isUser
        ? 'var(--cm-accent-color, rgba(74, 158, 255, 0.2))'
        : 'var(--cm-message-bg, rgba(255, 255, 255, 0.05))',
    color: isUser
        ? 'var(--cm-message-text, white)'
        : 'var(--cm-text-color, #cdc8d0)',
})

export const messageContentStyles = {
    whiteSpace: 'pre-wrap',
    lineHeight: '1.2',
    display: 'flex',
    flexDirection: 'column',
}

export const codeBlockContainerStyles = {
    margin: '0',
    position: 'relative',
    border: '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
}

export const codeBlockEditorTheme = EditorView.theme({
    '&': {
        backgroundColor: 'transparent !important',
        height: 'auto !important',
        flex: 'initial !important',
        position: 'static !important',
    },
    '.cm-content': {
        padding: '16px !important',
        height: 'auto !important',
        fontFamily:
            'var(--cm-font-family-mono, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace) !important',
        fontSize: '13px !important',
        lineHeight: '1.5 !important',
    },
    '.cm-line': {
        padding: '0 !important',
    },
    '.cm-scroller': {
        height: 'auto !important',
        flex: 'initial !important',
        width: '100% !important',
    },
})

export const codeBlockHeaderStyles = {
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    background:
        'linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))',
    color: 'var(--cm-text-secondary, rgba(255, 255, 255, 0.6))',
    fontSize: '11px',
    fontFamily:
        'var(--cm-font-family-mono, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace)',
    textTransform: 'lowercase',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    userSelect: 'none',
}

export const dotStyles = {
    fontSize: '8px',
    opacity: '0.5',
}

export const textContainerStyles = {
    margin: '0',
    padding: '0',
    lineHeight: 'inherit',
}

// Settings panel styles
export const settingsPanelContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    padding: '12px',
}

export const settingsHeaderStyles = {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--cm-text-color, #cdc8d0)',
    padding: '6px 10px',
    background: 'var(--cm-selected-bg, rgba(255, 255, 255, 0.05))',
    borderRadius: '4px 4px 0 0',
    marginBottom: '-1px',
    borderBottom: '1px solid var(--cm-selected-bg, rgba(255, 255, 255, 0.05))',
}

export const settingsDescriptionStyles = {
    fontSize: '12px',
    marginTop: '12px',
    marginBottom: '16px',
    color: 'var(--cm-text-color, #cdc8d0)',
    opacity: '0.7',
}

export const settingsInputsContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
}

export const getSettingsInputStyles = (hasApiKey: boolean) => ({
    display: hasApiKey ? 'none' : 'flex',
    gap: '8px',
})

export const settingsInputFieldStyles = {
    flex: '1',
    background: 'var(--cm-input-bg, rgba(255, 255, 255, 0.05))',
    border: '1px solid var(--cm-border-color, rgba(255, 255, 255, 0.1))',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '13px',
    color: 'var(--cm-text-color, #cdc8d0)',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'monospace',
}

export const settingsMessageContainerStyles = (hasApiKey: boolean) => ({
    fontSize: '12px',
    color: 'var(--cm-text-color, #cdc8d0)',
    opacity: '0.7',
    padding: '6px 12px',
    display: hasApiKey ? 'flex' : 'none',
    alignItems: 'center',
    background: 'var(--cm-input-bg, rgba(255, 255, 255, 0.05))',
    borderRadius: '4px',
    height: '33px',
    boxSizing: 'border-box',
})

export const inlineCodeStyles = `
    background: var(--cm-code-bg, rgba(96, 125, 139, 0.3));
    padding: 1px 4px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 12px;
    display: inline;
    white-space: pre;
    color: var(--cm-code-color, #e5e7eb);
`
