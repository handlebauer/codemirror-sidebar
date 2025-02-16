// src/index.ts (Main entry point for your extension)
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import {
    sidebar,
    toggleSidebarEffect,
    setActivePanelEffect,
    sidebarState,
} from './sidebar'
import { fileExplorer } from './explorer'
import { javascript } from '@codemirror/lang-javascript' // Or a default language
import { type Extension } from '@codemirror/state'

interface SidebarExtensionOptions {
    language?: Extension // Allow overriding the language
    // theme?: Extension // Allow overriding the theme
    // Add other configuration options as needed
}

export function sidebarExtension(
    options: SidebarExtensionOptions = {},
): Extension {
    const { language = javascript() } = options

    return [
        keymap.of(defaultKeymap),
        sidebar,
        fileExplorer,
        language, // Add the language support
        EditorView.updateListener.of(update => {
            const hasToggleSidebarEffect = update.transactions.some(tr =>
                tr.effects.some(e => e.is(toggleSidebarEffect)),
            )
            if (hasToggleSidebarEffect) {
                const sidebarVisible = update.state.field(sidebarState).visible
                if (sidebarVisible) {
                    update.view.dispatch({
                        effects: [setActivePanelEffect.of('file-explorer')], // Use setActivePanelEffect
                    })
                }
            }
        }),
    ]
}
