import { EditorView, basicSetup } from 'codemirror'
import { sidebarExtension, createAISidebar } from '../src/index'
import { demoTheme } from './theme'
import { toggleSidebarCommand } from '../src/sidebar'

// Create the editor instance
const view = new EditorView({
    doc: 'console.log("Hello world")',
    extensions: [
        basicSetup,
        // File explorer sidebar on the left
        sidebarExtension({
            sidebarOptions: {
                dock: 'left',
                overlay: false,
                width: '250px',
                backgroundColor: 'var(--cm-sidebar-background)',
                id: 'file-explorer',
            },
        }),
        // AI assistant sidebar on the right
        createAISidebar({
            width: '300px',
            backgroundColor: 'var(--cm-sidebar-background)',
        }),
        demoTheme,
    ],
    parent: document.querySelector('.demo-container') as Element,
})

// Create and add the toggle buttons
const createToggleButton = (text: string, sidebarId: string) => {
    const button = document.createElement('button')
    button.textContent = text
    button.className = 'toggle-button'
    button.onclick = () => toggleSidebarCommand(view, sidebarId)
    return button
}

const fileExplorerButton = createToggleButton(
    'Toggle File Explorer',
    'file-explorer',
)
const aiAssistantButton = createToggleButton(
    'Toggle AI Assistant',
    'ai-assistant',
)

// Add buttons to container
const container = document.querySelector('.demo-container')
if (container) {
    const buttonContainer = document.createElement('div')
    buttonContainer.className = 'button-container'
    buttonContainer.appendChild(fileExplorerButton)
    buttonContainer.appendChild(aiAssistantButton)
    container.insertBefore(buttonContainer, view.dom)
}

// Make view available in console for debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).view = view
