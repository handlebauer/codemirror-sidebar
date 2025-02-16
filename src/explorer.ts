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
    expandedDirs: Set<string> // Track expanded directory paths
}

const loadFileEffect = StateEffect.define<string>()
const updateFilesEffect = StateEffect.define<File[]>()
const toggleDirEffect = StateEffect.define<string>() // Toggle directory expanded state

const fileExplorerState = StateField.define<FileExplorerState>({
    create() {
        // Start with empty files array
        return {
            files: [],
            selectedFile: null,
            expandedDirs: new Set(), // Start with all directories collapsed
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
                    selectedFile: effect.value[0]?.name || null,
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
    const indentation = level * 8 // Reduced from 16px to 8px per level
    const explorerState = view.state.field(fileExplorerState)

    if (node.isDirectory) {
        // Render directory
        const isExpanded = explorerState.expandedDirs.has(node.path)
        const caretSpan = crelt(
            'span',
            {
                class: `cm-directory-caret${isExpanded ? ' expanded' : ''}`,
                style: `display: flex; align-items: center; justify-content: center; width: 8px; height: 16px; line-height: 16px; text-align: center; user-select: none; font-size: 12px; opacity: 0.6; transform: rotate(${isExpanded ? '90deg' : '0deg'}); transition: transform 0.15s ease;`,
            },
            '›',
        )
        const dirSpan = crelt(
            'span',
            {
                class: 'cm-file-explorer-directory',
                style: 'margin-left: 4px; user-select: none; display: flex; align-items: center;',
            },
            node.name,
        )
        const dirItem = crelt(
            'li',
            {
                class: 'cm-file-explorer-item cm-file-explorer-directory-item',
                style: `padding-left: ${indentation}px; display: flex; align-items: center;`,
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
                class: 'cm-file-explorer-file',
                style: 'user-select: none; margin-left: 12px;', // 8px (caret) + 4px (matching directory margin)
            },
            node.name,
        )
        const fileItem = crelt(
            'li',
            {
                'data-file': node.path,
                class: `cm-file-explorer-item${
                    node.path === selectedFile
                        ? ' cm-file-explorer-item-selected'
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
    const header = crelt('h3', { style: 'user-select: none;' }, 'Files')
    const fileList = crelt('ul', { class: 'cm-file-explorer-list' })

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
export { loadFileEffect, updateFilesEffect }
