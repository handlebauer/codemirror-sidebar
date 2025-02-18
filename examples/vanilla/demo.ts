import { EditorView } from 'codemirror'
import { demoFiles, fallbackFiles, PROJECT_NAME } from './data'
import { createToolbar } from './components/toolbar'
import { createEditorExtensions } from './config/editor'
import { initializeEditorContent } from './utils/files'
import { setProjectNameEffect } from '../../src/explorer'

// Initialize the demo
async function initializeDemo() {
    const demoContainer = document.querySelector('.demo-container') as Element

    // Add toolbar
    demoContainer.appendChild(createToolbar())

    // Create editor
    const view = new EditorView({
        extensions: createEditorExtensions(),
        parent: demoContainer,
    })

    // Set project name and initialize content
    view.dispatch({ effects: setProjectNameEffect.of(PROJECT_NAME) })
    await initializeEditorContent(view, demoFiles, fallbackFiles)

    // Make editor available for debugging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).editor = view
}

// Start the demo
initializeDemo().catch(error => {
    console.error('Failed to initialize demo:', error)
})
