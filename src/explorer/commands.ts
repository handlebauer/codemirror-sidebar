import { EditorView } from '@codemirror/view'
import { toggleSidebarCommand } from '../sidebar'

/**
 * Toggle the file explorer visibility
 */
export function toggleExplorer(view: EditorView): boolean {
    return toggleSidebarCommand(view, 'file-explorer')
}
