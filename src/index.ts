import { ViewPlugin, EditorView, ViewUpdate } from '@codemirror/view'
import { StateField, StateEffect } from '@codemirror/state'
import crelt from 'crelt'

// Effect to toggle sidebar visibility
const toggleSidebarEffect = StateEffect.define<boolean>()

// StateField to track sidebar visibility
const sidebarState = StateField.define<boolean>({
    create: () => false,
    update(value, tr) {
        for (const e of tr.effects) {
            if (e.is(toggleSidebarEffect)) return e.value
        }
        return value
    },
})

// Command to toggle sidebar
const toggleSidebar = (view: EditorView) => {
    view.dispatch({
        effects: toggleSidebarEffect.of(!view.state.field(sidebarState)),
    })
    return true
}

// ViewPlugin for sidebar
const sidebarPlugin = ViewPlugin.fromClass(
    class {
        dom: HTMLElement
        explorerPanel: HTMLElement
        assistantPanel: HTMLElement

        constructor(view: EditorView) {
            // Create sidebar container
            this.dom = crelt('div', {
                class: 'cm-sidebar',
                style: `
                    position: absolute;
                    right: 0;
                    top: 0;
                    height: 100%;
                    width: 250px;
                    background: #21222c;
                    display: none;
                    z-index: 10;
                    padding: 10px 20px;
                `,
            })

            // Create panels with click handlers
            this.explorerPanel = crelt(
                'div',
                {
                    class: 'cm-sidebar-explorer',
                    onclick: () => console.log('Explorer panel clicked!'),
                },
                'Explorer',
            )
            this.assistantPanel = crelt(
                'div',
                {
                    class: 'cm-sidebar-assistant',
                    onclick: () => console.log('Assistant panel clicked!'),
                },
                'Assistant',
            )

            // Add panels to sidebar
            this.dom.appendChild(this.explorerPanel)
            this.dom.appendChild(this.assistantPanel)

            // Add sidebar to editor dom instead of parent
            view.dom.appendChild(this.dom)

            // Ensure editor container has relative positioning
            view.dom.style.position = 'relative'

            // Initial visibility
            this.updateVisibility(view)
        }

        update(update: ViewUpdate) {
            if (
                update.state.field(sidebarState) !==
                update.startState.field(sidebarState)
            ) {
                this.updateVisibility(update.view)
            }
        }

        destroy() {
            this.dom.remove()
        }

        private updateVisibility(view: EditorView) {
            const visible = view.state.field(sidebarState)
            this.dom.style.display = visible ? 'block' : 'none'
        }
    },
)

// The complete sidebar extension
export const sidebar = [sidebarState, sidebarPlugin]

// Export the toggle command
export const toggleSidebarCommand = toggleSidebar
