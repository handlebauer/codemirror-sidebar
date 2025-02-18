import { StateField, StateEffect, Compartment } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { type SidebarPanelSpec, sidebarPanel } from '../sidebar'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { markdown } from '@codemirror/lang-markdown'
import { json } from '@codemirror/lang-json'
import crelt from 'crelt'
import { styles, inlineStyles } from './styles'

// Add debug logging helper
const debug = (...args: unknown[]) => console.log('[Explorer]', ...args)

// Define the File type
export interface File {
    name: string
    content: string // Code content
}

// Define the File Explorer State
interface FileExplorerState {
    files: File[]
    selectedFile: string | null
    expandedDirs: Set<string> // Track expanded directory paths
    projectName?: string
}

const loadFileEffect = StateEffect.define<string>()
const updateFilesEffect = StateEffect.define<File[]>()
const toggleDirEffect = StateEffect.define<string>() // Toggle directory expanded state
const setProjectNameEffect = StateEffect.define<string>()

const fileExplorerState = StateField.define<FileExplorerState>({
    create() {
        // Start with empty files array
        return {
            files: [],
            selectedFile: null,
            expandedDirs: new Set(), // Start with all directories collapsed
            projectName: undefined,
        }
    },
    update(value, transaction) {
        for (const effect of transaction.effects) {
            if (effect.is(loadFileEffect)) {
                // A file was selected
                return { ...value, selectedFile: effect.value }
            } else if (effect.is(updateFilesEffect)) {
                // Files were updated
                return {
                    ...value,
                    files: effect.value,
                    selectedFile: null, // Don't select any file by default
                }
            } else if (effect.is(toggleDirEffect)) {
                // Toggle directory expanded state
                const newExpandedDirs = new Set(value.expandedDirs)
                if (newExpandedDirs.has(effect.value)) {
                    newExpandedDirs.delete(effect.value)
                } else {
                    newExpandedDirs.add(effect.value)
                }
                return { ...value, expandedDirs: newExpandedDirs }
            } else if (effect.is(setProjectNameEffect)) {
                return { ...value, projectName: effect.value }
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
        const dom = crelt('div', { class: styles.explorerContent })
        renderFileExplorer(dom, view)
        debug('File explorer panel created')
        return dom
    },
    update(view: EditorView): void {
        debug('Updating file explorer panel')
        const dom = view.dom.querySelector(`.${styles.explorerContent}`)
        if (dom) {
            renderFileExplorer(dom as HTMLElement, view)
            debug('File explorer panel updated')
        } else {
            debug('Warning: Could not find explorer content element')
        }
    },
}

// Add helper functions for file hierarchy
interface FileNode {
    name: string
    path: string
    content?: string
    isDirectory: boolean
    children: FileNode[]
}

function buildFileTree(files: File[]): FileNode[] {
    const root: FileNode[] = []
    const directories: { [path: string]: FileNode } = {}

    // Sort files to ensure directories are processed in order
    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name))

    sortedFiles.forEach(file => {
        const parts = file.name.split('/')
        let currentPath = ''
        let currentChildren = root

        // Process each part of the path
        parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part
            const isLastPart = index === parts.length - 1

            if (isLastPart) {
                // This is a file
                currentChildren.push({
                    name: part,
                    path: currentPath,
                    content: file.content,
                    isDirectory: false,
                    children: [],
                })
            } else {
                // This is a directory
                if (!directories[currentPath]) {
                    const dirNode: FileNode = {
                        name: part,
                        path: currentPath,
                        isDirectory: true,
                        children: [],
                    }
                    directories[currentPath] = dirNode
                    currentChildren.push(dirNode)
                }
                currentChildren = directories[currentPath].children
            }
        })
    })

    // Sort all directory children recursively
    const sortNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes
            .sort((a, b) => {
                // Sort directories before files
                if (a.isDirectory !== b.isDirectory) {
                    return a.isDirectory ? -1 : 1
                }
                // Then sort alphabetically by name
                return a.name.localeCompare(b.name)
            })
            .map(node => {
                if (node.isDirectory) {
                    node.children = sortNodes(node.children)
                }
                return node
            })
    }

    return sortNodes(root)
}

function renderFileNode(
    node: FileNode,
    level: number,
    container: HTMLElement,
    view: EditorView,
    selectedFile: string | null,
) {
    const indentation = 10 + level * 8 // Reduced from 16px to 8px per level
    const explorerState = view.state.field(fileExplorerState)

    if (node.isDirectory) {
        // Render directory
        const isExpanded = explorerState.expandedDirs.has(node.path)
        const caretSpan = crelt(
            'span',
            {
                class: `${styles.directoryCaret}${isExpanded ? ` ${styles.directoryCaretExpanded}` : ''}`,
                style: `${inlineStyles.caret}${isExpanded ? `; ${inlineStyles.caretExpanded}` : ''}`,
            },
            '›',
        )
        const dirSpan = crelt(
            'span',
            {
                class: styles.explorerDirectory,
                style: inlineStyles.directorySpan,
            },
            node.name,
        )
        const dirItem = crelt(
            'li',
            {
                class: `${styles.explorerItem} ${styles.explorerDirectoryItem}`,
                style: `padding-left: ${indentation}px`,
                onclick: () => {
                    view.dispatch({
                        effects: toggleDirEffect.of(node.path),
                    })
                },
            },
            caretSpan,
            dirSpan,
        )
        container.appendChild(dirItem)

        // Only render children if directory is expanded
        if (isExpanded) {
            node.children.forEach(child =>
                renderFileNode(child, level + 1, container, view, selectedFile),
            )
        }
    } else {
        // Render file
        const fileSpan = crelt(
            'span',
            {
                class: styles.explorerFile,
                style: inlineStyles.fileSpan,
            },
            node.name,
        )
        const fileItem = crelt(
            'li',
            {
                'data-file': node.path,
                class: `${styles.explorerItem}${
                    node.path === selectedFile
                        ? ` ${styles.explorerItemSelected}`
                        : ''
                }`,
                style: `padding-left: ${indentation}px`,
                onclick: () =>
                    handleFileClick(
                        { name: node.path, content: node.content! },
                        view,
                    ),
            },
            fileSpan,
        )
        container.appendChild(fileItem)
    }
}

function renderFileExplorer(dom: HTMLElement, view: EditorView) {
    debug('Rendering file explorer content')
    const explorerState = view.state.field(fileExplorerState)
    const header = crelt(
        'h3',
        {
            style: inlineStyles.header,
        },
        explorerState.projectName || 'Files',
    )
    const fileList = crelt('ul', {
        class: styles.explorerList,
        style: Object.entries(inlineStyles.list)
            .map(([k, v]) => `${k}:${v}`)
            .join(';'),
    })

    debug(
        'Current files:',
        explorerState.files.map(f => f.name),
    )
    debug('Selected file:', explorerState.selectedFile)

    // Build and render file tree
    const fileTree = buildFileTree(explorerState.files)
    fileTree.forEach(node =>
        renderFileNode(node, 0, fileList, view, explorerState.selectedFile),
    )

    dom.innerHTML = ''
    dom.appendChild(header)
    dom.appendChild(fileList)
    debug('File explorer content rendered')
}

// Language detection based on file extension
function getLanguageExtension(filename: string) {
    const ext = filename.toLowerCase().split('.').pop()
    switch (ext) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            return javascript({ typescript: ext.startsWith('ts') })
        case 'py':
            return python()
        case 'md':
        case 'markdown':
            return markdown()
        case 'json':
            return json()
        default:
            return null
    }
}

// Create a compartment for language support
const languageCompartment = new Compartment()

function handleFileClick(file: File, view: EditorView) {
    debug('File clicked:', file.name)

    // Get language extension for the file
    const langExtension = getLanguageExtension(file.name)

    // Create a transaction that combines all our changes
    view.dispatch({
        effects: [
            loadFileEffect.of(file.name),
            // Only reconfigure if we have a language extension
            ...(langExtension
                ? [languageCompartment.reconfigure(langExtension)]
                : []),
        ],
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
        update(update: ViewUpdate) {
            // If the fileExplorerState changed, trigger the panel update
            if (
                update.state.field(fileExplorerState) !==
                update.startState.field(fileExplorerState)
            ) {
                const dom = update.view.dom.querySelector(
                    `.${styles.explorerContent}`,
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
    // Initialize language compartment with empty configuration
    languageCompartment.of([]),
]
export { loadFileEffect, updateFilesEffect, setProjectNameEffect }
