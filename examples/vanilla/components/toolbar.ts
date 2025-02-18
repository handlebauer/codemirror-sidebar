// Toolbar components and creation functions
const EDITOR_TITLE = 'Code Editor'

export function createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'cm-toolbar'

    toolbar.appendChild(createToolbarLeft())
    toolbar.appendChild(createToolbarRight())

    return toolbar
}

function createToolbarLeft() {
    const toolbarLeft = document.createElement('div')
    toolbarLeft.className = 'cm-toolbar-left'

    const title = document.createElement('span')
    title.className = 'cm-toolbar-title'
    title.textContent = EDITOR_TITLE

    toolbarLeft.appendChild(title)
    return toolbarLeft
}

function createToolbarRight() {
    const toolbarRight = document.createElement('div')
    toolbarRight.className = 'cm-toolbar-right'

    return toolbarRight
}
