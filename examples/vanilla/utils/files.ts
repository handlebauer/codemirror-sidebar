import { EditorView } from 'codemirror'
import { toggleSidebarEffect } from '../../../src'
import { updateFilesEffect, type File } from '../../../src/explorer'
import logger from '../../../src/utils/logger'

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
        })
    } catch (error) {
        logger.error('Error initializing editor content:', error)
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
                insert: 'Select a file from the explorer to begin editing',
            },
        })
    }
}
