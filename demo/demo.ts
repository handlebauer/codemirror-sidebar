import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { sidebar, toggleSidebarCommand } from '../src/index'
import { demoTheme } from './theme'
const view = new EditorView({
    doc: 'console.log("Hello world")',
    extensions: [basicSetup, javascript(), sidebar, demoTheme],
    parent: document.body,
})

// Add a button to toggle the sidebar
const toggleButton = document.createElement('button')
toggleButton.textContent = 'Toggle Sidebar'
toggleButton.className = 'toggle-button'
toggleButton.onclick = () => toggleSidebarCommand(view)

const container = document.querySelector('.demo-container')
if (container) {
    container.insertBefore(toggleButton, null)
    container.appendChild(view.dom)
} else {
    document.body.insertBefore(toggleButton, view.dom)
}

// Make view available in console for debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).view = view
