// Styles for the sidebar component

export const styles = {
    sidebar: 'cm-sidebar',
    resizeHandle: 'cm-sidebar-resize-handle',
    panelContainer: 'cm-sidebar-panel-container',
}

export const defaultSidebarOptions = {
    width: '250px',
    backgroundColor: '#21222c',
    overlay: true,
}

export const inlineStyles = {
    editor: {
        overlay: {
            display: 'flex !important',
            flexDirection: 'row-reverse !important',
            position: 'relative',
            width: '100%',
            height: '100%',
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
            width: '250px',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: '0',
            transition: 'transform 0.2s ease-in-out',
            transform: 'translateX(0)',
        },
        overlay: {
            zIndex: '10',
            position: 'relative',
        },
        nonOverlay: {
            position: 'relative',
            zIndex: '1',
            overflow: 'hidden',
            flexShrink: '0',
        },
        hidden: {
            transform: 'translateX(100%)',
            display: 'none',
        },
    },
    resizeHandle: {
        position: 'absolute',
        top: '0',
        width: '8px',
        height: '100%',
        cursor: 'col-resize',
        zIndex: '20',
    },
    editorContent: {
        flex: '1',
        minWidth: '0',
        height: '100%',
        overflow: 'auto',
    },
    dragging: {
        cursor: 'col-resize',
        userSelect: 'none',
    },
}
