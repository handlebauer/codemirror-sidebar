import { StateField, StateEffect } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { type SidebarPanelSpec, sidebarPanel } from './sidebar'
import crelt from 'crelt'

// Add debug logging helper
const debug = (...args: unknown[]) => console.log('[Explorer]', ...args)

// Define the File type
interface File {
    name: string
    content: string // Code content
}

// Define the File Explorer State
interface FileExplorerState {
    files: File[]
    selectedFile: string | null
}

const loadFileEffect = StateEffect.define<string>()

const fileExplorerState = StateField.define<FileExplorerState>({
    create() {
        // Mock project files for now
        return {
            files: [
                {
                    name: 'main.js',
                    content: "console.log('Hello from main.js');",
                },
                {
                    name: 'utils.js',
                    content: 'export function add(a, b) { return a + b; }',
                },
            ],
            selectedFile: null,
        }
    },
    update(value, transaction) {
        for (const effect of transaction.effects) {
            if (effect.is(loadFileEffect)) {
                // A file was selected
                return { ...value, selectedFile: effect.value }
            }
        }
        return value
    },
})

// Create Panel Specification
const fileExplorerPanelSpec: SidebarPanelSpec = {
    id: 'file-explorer',
    create(view: EditorView): HTMLElement {
        debug('Creating file explorer panel')
        const dom = crelt('div', { class: 'cm-sidebar-explorer-content' })
        renderFileExplorer(dom, view)
        debug('File explorer panel created')
        return dom
    },
    update(view: EditorView): void {
        debug('Updating file explorer panel')
        const dom = view.dom.querySelector('.cm-sidebar-explorer-content')
        if (dom) {
            renderFileExplorer(dom as HTMLElement, view)
            debug('File explorer panel updated')
        } else {
            debug('Warning: Could not find explorer content element')
        }
    },
}

function renderFileExplorer(dom: HTMLElement, view: EditorView) {
    debug('Rendering file explorer content')
    const explorerState = view.state.field(fileExplorerState)
    const header = crelt('h3', {}, 'Files')
    const fileList = crelt('ul', { class: 'cm-file-explorer-list' })

    debug(
        'Current files:',
        explorerState.files.map(f => f.name),
    )
    debug('Selected file:', explorerState.selectedFile)

    explorerState.files.forEach(file => {
        const span = crelt(
            'span',
            { class: 'cm-file-explorer-item-name' },
            file.name,
        )

        const li = crelt(
            'li',
            {
                'data-file': file.name,
                class: `cm-file-explorer-item${
                    file.name === explorerState.selectedFile
                        ? ' cm-file-explorer-item-selected'
                        : ''
                }`,
                onclick: () => handleFileClick(file, view),
            },
            span,
        )
        fileList.appendChild(li)
    })

    dom.innerHTML = ''
    dom.appendChild(header)
    dom.appendChild(fileList)
    debug('File explorer content rendered')
}

function handleFileClick(file: File, view: EditorView) {
    debug('File clicked:', file.name)
    view.dispatch({
        effects: loadFileEffect.of(file.name),
        changes: {
            from: 0,
            to: view.state.doc.length,
            insert: file.content,
        },
    })
    debug('File content loaded:', file.name)
}

const fileExplorerPlugin = ViewPlugin.fromClass(
    class {
        constructor() {}
        update(update: ViewUpdate) {
            // If the fileExplorerState changed, trigger the panel update
            if (
                update.state.field(fileExplorerState) !==
                update.startState.field(fileExplorerState)
            ) {
                const dom = update.view.dom.querySelector(
                    '.cm-sidebar-explorer-content',
                )
                if (dom) {
                    renderFileExplorer(dom as HTMLElement, update.view)
                }
            }
        }
    },
)

export const fileExplorer = [
    fileExplorerState,
    fileExplorerPlugin,
    sidebarPanel.of(fileExplorerPanelSpec),
]
export { loadFileEffect }
