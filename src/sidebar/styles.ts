// Styles for the sidebar component

// Class name mappings
export const styles = {
    sidebar: 'cm-ext-sidebar',
    resizeHandle: 'cm-ext-sidebar-resize',
    panelContainer: 'cm-ext-sidebar-panel',
}

// Default behavioral options
export const defaultSidebarOptions = {
    overlay: true,
}

export const inlineStyles = {
    editor: {
        overlay: {
            display: 'flex !important',
            position: 'relative',
            width: '100%',
            height: '100%',
        },
        nonOverlay: {
            display: 'flex !important',
            position: 'relative',
        },
    },
    editorContent: {
        flex: '1',
        minWidth: '0',
        height: '100%',
        overflow: 'auto',
    },
}
