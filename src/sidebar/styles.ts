// Styles for the sidebar component

export const styles = {
    sidebar: 'cm-sidebar',
    resizeHandle: 'cm-sidebar-resize-handle',
    panelContainer: 'cm-sidebar-panel-container',
}

export const defaultSidebarOptions = {
    width: '250px',
    backgroundColor: '#21222c',
    overlay: true, // Default to overlay behavior
}

export const inlineStyles = {
    editor: {
        overlay: {
            display: 'block',
            position: 'relative',
        },
        nonOverlay: {
            display: 'flex !important',
            flexDirection: 'row !important',
            position: 'relative',
        },
    },
    sidebar: {
        base: {
            height: '100%',
            flexShrink: '0',
            display: 'flex',
            flexDirection: 'column',
            transition: 'none', // Remove transition for smoother resizing
            minWidth: '0', // Important for flex layout
        },
        overlay: {
            position: 'absolute',
            top: '0',
            zIndex: '10',
        },
        nonOverlay: {
            position: 'relative',
            zIndex: '1',
            overflow: 'hidden',
            flexShrink: '0',
            flexBasis: 'auto',
        },
    },
    resizeHandle: {
        position: 'absolute',
        top: '0',
        width: '4px',
        height: '100%',
        cursor: 'col-resize',
        zIndex: '20',
    },
    editorContent: {
        flex: '1 1 auto !important',
        width: 'auto !important',
        position: 'relative',
        minWidth: '0 !important', // Important for flex layout
        height: '100% !important',
    },
    dragging: {
        cursor: 'col-resize',
        userSelect: 'none',
    },
}
