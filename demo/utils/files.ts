import { EditorView } from 'codemirror'
import { toggleSidebarEffect } from '../../src/index'
import { updateFilesEffect } from '../../src/explorer'
import { type File } from '../../src/explorer'

export async function initializeEditorContent(
    view: EditorView,
    files: File[],
    fallbackFiles: File[],
) {
    try {
        const contentFiles = files && files.length > 0 ? files : fallbackFiles

        view.dispatch({
            effects: [
                toggleSidebarEffect.of({
                    id: 'file-explorer',
                    visible: true,
                }),
                updateFilesEffect.of(contentFiles),
            ],
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: contentFiles[0].content,
            },
        })
    } catch (error) {
        console.error('Error initializing editor content:', error)
        // Use fallback on error
        view.dispatch({
            effects: [
                toggleSidebarEffect.of({
                    id: 'file-explorer',
                    visible: true,
                }),
                updateFilesEffect.of(fallbackFiles),
            ],
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: fallbackFiles[0].content,
            },
        })
    }
}
