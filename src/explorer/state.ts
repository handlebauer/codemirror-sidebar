import { StateField, StateEffect } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import crelt from 'crelt'
import { styles, inlineStyles } from './styles'

// Define the File type
export interface File {
    name: string
    content: string
}

// Define the File Explorer State
interface FileExplorerState {
    files: File[]
    selectedFile: string | null
    expandedDirs: Set<string>
    projectName?: string
}

// Define state effects
export const selectFileEffect = StateEffect.define<string>()
export const updateFilesEffect = StateEffect.define<File[]>()
export const toggleDirEffect = StateEffect.define<string>()
export const setProjectNameEffect = StateEffect.define<string>()

// Create the state field
export const fileExplorerState = StateField.define<FileExplorerState>({
    create() {
        return {
            files: [],
            selectedFile: null,
            expandedDirs: new Set(),
            projectName: undefined,
        }
    },
    update(value, transaction) {
        for (const effect of transaction.effects) {
            if (effect.is(selectFileEffect)) {
                return { ...value, selectedFile: effect.value }
            } else if (effect.is(updateFilesEffect)) {
                return {
                    ...value,
                    files: effect.value,
                    selectedFile: null,
                }
            } else if (effect.is(toggleDirEffect)) {
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
export const fileExplorerPanelSpec = {
    id: 'file-explorer',
    create(view: EditorView): HTMLElement {
        const dom = crelt('div', { class: styles.explorerContent })
        renderFileExplorer(dom, view)
        return dom
    },
    update(view: EditorView): void {
        const dom = view.dom.querySelector(`.${styles.explorerContent}`)
        if (dom) {
            renderFileExplorer(dom as HTMLElement, view)
        }
    },
}

// Helper function to render the explorer
function renderFileExplorer(dom: HTMLElement, view: EditorView) {
    const explorerState = view.state.field(fileExplorerState)
    const header = crelt(
        'h3',
        { style: inlineStyles.header },
        explorerState.projectName || 'Files',
    )
    const fileList = crelt('ul', {
        class: styles.explorerList,
        style: Object.entries(inlineStyles.list)
            .map(([k, v]) => `${k}:${v}`)
            .join(';'),
    })

    // Build and render file tree
    const fileTree = buildFileTree(explorerState.files)
    fileTree.forEach(node =>
        renderFileNode(node, 0, fileList, view, explorerState.selectedFile),
    )

    dom.innerHTML = ''
    dom.appendChild(header)
    dom.appendChild(fileList)
}

// Helper types and functions for file tree
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

    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name))

    sortedFiles.forEach(file => {
        const parts = file.name.split('/')
        let currentPath = ''
        let currentChildren = root

        parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part
            const isLastPart = index === parts.length - 1

            if (isLastPart) {
                currentChildren.push({
                    name: part,
                    path: currentPath,
                    content: file.content,
                    isDirectory: false,
                    children: [],
                })
            } else {
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

    return sortNodes(root)
}

function sortNodes(nodes: FileNode[]): FileNode[] {
    return nodes
        .sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) {
                return a.isDirectory ? -1 : 1
            }
            return a.name.localeCompare(b.name)
        })
        .map(node => {
            if (node.isDirectory) {
                node.children = sortNodes(node.children)
            }
            return node
        })
}

function renderFileNode(
    node: FileNode,
    level: number,
    container: HTMLElement,
    view: EditorView,
    selectedFile: string | null,
) {
    const indentation = 10 + level * 8
    const explorerState = view.state.field(fileExplorerState)

    if (node.isDirectory) {
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

        if (isExpanded) {
            node.children.forEach(child =>
                renderFileNode(child, level + 1, container, view, selectedFile),
            )
        }
    } else {
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
                onclick: () => {
                    if (node.content) {
                        view.dispatch({
                            effects: [selectFileEffect.of(node.path)],
                            changes: {
                                from: 0,
                                to: view.state.doc.length,
                                insert: node.content,
                            },
                        })
                    }
                },
            },
            fileSpan,
        )
        container.appendChild(fileItem)
    }
}
