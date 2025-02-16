import { EditorView, basicSetup } from 'codemirror'
import {
    sidebarExtension,
    createAISidebar,
    toggleSidebarEffect,
} from '../src/index'
import { oneDark } from '@codemirror/theme-one-dark'
import { demoFiles } from './data'
import { updateFilesEffect } from '../src/explorer'

// Create the demo container
const demoContainer = document.querySelector('.demo-container') as Element

// Create the toolbar
const toolbar = document.createElement('div')
toolbar.className = 'cm-toolbar'

const toolbarLeft = document.createElement('div')
toolbarLeft.className = 'cm-toolbar-left'

const title = document.createElement('span')
title.className = 'cm-toolbar-title'
title.textContent = 'Code Editor'
toolbarLeft.appendChild(title)

const toolbarRight = document.createElement('div')
toolbarRight.className = 'cm-toolbar-right'

// Create settings button
const settingsButton = document.createElement('button')
settingsButton.className = 'cm-toolbar-icon-button'
settingsButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
`

toolbarRight.appendChild(settingsButton)

toolbar.appendChild(toolbarLeft)
toolbar.appendChild(toolbarRight)

demoContainer.appendChild(toolbar)

// Create the editor instance
const view = new EditorView({
    doc: demoFiles[0].content, // Start with the content of the first file
    extensions: [
        basicSetup,
        // File explorer sidebar on the left
        sidebarExtension({
            sidebarOptions: {
                dock: 'left',
                overlay: false,
                width: '250px',
                backgroundColor: '#2c313a', // One Dark lighter sidebar background
                id: 'file-explorer',
            },
            toggleKeymaps: {
                mac: 'Cmd-b',
                win: 'Ctrl-b',
            },
        }),
        // AI assistant sidebar on the right
        createAISidebar({
            width: '300px',
            backgroundColor: '#2c313a', // One Dark lighter sidebar background
            toggleKeymaps: {
                mac: 'Cmd-r',
                win: 'Ctrl-r',
            },
        }),
        oneDark,
    ],
    parent: document.querySelector('.demo-container') as Element,
})

// Make the file explorer visible by default and initialize with demo files
view.dispatch({
    effects: [
        toggleSidebarEffect.of({
            id: 'file-explorer',
            visible: true,
        }),
        updateFilesEffect.of(demoFiles),
    ],
})

// Make view available in console for debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).view = view
