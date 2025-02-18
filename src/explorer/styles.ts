// Styles for the file explorer

export const styles = {
    explorerContent: 'cm-explorer-content',
    explorerList: 'cm-explorer-list',
    explorerItem: 'cm-explorer-item',
    explorerDirectory: 'cm-explorer-directory',
    explorerDirectoryItem: 'cm-explorer-directory-item',
    explorerFile: 'cm-explorer-file',
    explorerItemSelected: 'cm-explorer-item-selected',
    directoryCaret: 'cm-directory-caret',
    directoryCaretExpanded: 'cm-directory-caret-expanded',
}

// CSS classes for hover and selected states
const cssClasses = `
.cm-sidebar-panel-container {
    height: 100%;
    overflow-y: auto;
}

.${styles.explorerItem} {
    border: 1px solid #2c313a;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.${styles.explorerItem}:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.${styles.explorerItemSelected} {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
`

// Add styles to document if in browser environment
if (typeof document !== 'undefined') {
    const style = document.createElement('style')
    style.textContent = cssClasses
    document.head.appendChild(style)
}

export const inlineStyles = {
    header: 'margin: 0; padding: 8px 16px; font-size: 14px; font-weight: 500; color: #abb2bf;',
    list: {
        margin: '0',
        padding: '0',
        listStyle: 'none',
    },
    caret: 'display: inline-block; margin-right: 6px; transition: transform 0.15s ease;',
    caretExpanded: 'transform: rotate(90deg);',
    directorySpan: 'font-weight: 500;',
    fileSpan: 'color: #abb2bf;',
}
