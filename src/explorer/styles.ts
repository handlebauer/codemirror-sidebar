// Styles for the file explorer

export const styles = {
    explorerContent: 'cm-sidebar-explorer-content',
    explorerList: 'cm-file-explorer-list',
    explorerItem: 'cm-file-explorer-item',
    explorerDirectory: 'cm-file-explorer-directory',
    explorerDirectoryItem: 'cm-file-explorer-directory-item',
    explorerFile: 'cm-file-explorer-file',
    explorerItemSelected: 'cm-file-explorer-item-selected',
    directoryCaret: 'cm-directory-caret',
    directoryCaretExpanded: 'expanded',
}

export const inlineStyles = {
    header: 'user-select: none; text-transform: uppercase; font-size: 14px; font-weight: 800; margin: 0; padding: 4px 8px 3px; letter-spacing: 0.5px; color: #cdc8d0;',
    caret: 'display: flex; align-items: center; justify-content: center; width: 8px; height: 16px; line-height: 16px; text-align: center; user-select: none; font-size: 13px; opacity: 0.6; transform: rotate(0deg); transition: transform 0.15s ease;',
    caretExpanded: 'transform: rotate(90deg)',
    directorySpan:
        'margin-left: 4px; user-select: none; display: flex; align-items: center; font-size: 14px; font-weight: 500;',
    directoryItem: 'padding: 1.5px 0; display: flex; align-items: center;',
    fileSpan:
        'user-select: none; margin-left: 12px; font-size: 14px; font-weight: 500;',
    fileItem: 'padding: 3px 0;',
}
