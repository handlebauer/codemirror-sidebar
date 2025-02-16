import { EditorView, basicSetup } from 'codemirror'
import { sidebarExtension } from '../src/index'
import { demoTheme } from './theme'
import { toggleSidebarCommand } from '../src/sidebar'

// Create the editor instance
const view = new EditorView({
    doc: 'console.log("Hello world")',
    extensions: [
        basicSetup,
        sidebarExtension(), // Using the new unified extension
        demoTheme,
    ],
    parent: document.querySelector('.demo-container') as Element,
})

// Create and add the toggle button
const toggleButton = document.createElement('button')
toggleButton.textContent = 'Toggle Sidebar'
toggleButton.className = 'toggle-button'
toggleButton.onclick = () => toggleSidebarCommand(view)

// Add button to container
const container = document.querySelector('.demo-container')
if (container) {
    container.insertBefore(toggleButton, view.dom)
}

// Make view available in console for debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).view = view
