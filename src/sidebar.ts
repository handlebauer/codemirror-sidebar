import { ViewPlugin, EditorView, ViewUpdate } from '@codemirror/view'
import { StateField, StateEffect, Facet } from '@codemirror/state'
import crelt from 'crelt'

// -- TYPES ---------------------------------------------------------------
interface SidebarPanelSpec {
    id: string
    create: (view: EditorView) => HTMLElement
    update?: (view: EditorView) => void
    destroy?: (view: EditorView) => void
}

interface SidebarOptions {
    width?: string
    backgroundColor?: string
}

interface SidebarState {
    visible: boolean
    options: SidebarOptions
    activePanelId: string | null
}

// -- CONSTANTS -----------------------------------------------------------
const defaultSidebarOptions: SidebarOptions = {
    width: '250px',
    backgroundColor: '#21222c',
}

// -- FACETS ------------------------------------------------------------
const sidebarPanel = Facet.define<SidebarPanelSpec, SidebarPanelSpec[]>({
    combine: values => values.flat(),
})

// -- STATE ------------------------------------------------------------------
const toggleSidebarEffect = StateEffect.define<boolean>()
const updateSidebarOptionsEffect = StateEffect.define<SidebarOptions>()
const setActivePanelEffect = StateEffect.define<string | null>()

const sidebarState = StateField.define<SidebarState>({
    create: () => ({
        visible: false,
        options: defaultSidebarOptions,
        activePanelId: null,
    }),
    update(value, tr) {
        let newState = value
        for (const e of tr.effects) {
            if (e.is(toggleSidebarEffect)) {
                newState = { ...newState, visible: e.value }
            } else if (e.is(updateSidebarOptionsEffect)) {
                newState = {
                    ...newState,
                    options: { ...newState.options, ...e.value },
                }
            } else if (e.is(setActivePanelEffect)) {
                newState = { ...newState, activePanelId: e.value }
            }
        }
        return newState
    },
})

// -- COMMANDS ---------------------------------------------------------------
const toggleSidebarCommand = (view: EditorView) => {
    view.dispatch({
        effects: toggleSidebarEffect.of(
            !view.state.field(sidebarState).visible,
        ),
    })
    return true
}

// -- VIEW PLUGIN ------------------------------------------------------------
const debug = (...args: unknown[]) => console.log('[Sidebar]', ...args)

const sidebarPlugin = ViewPlugin.fromClass(
    class {
        dom: HTMLElement
        panelContainer: HTMLElement
        activePanel: HTMLElement | null = null

        constructor(view: EditorView) {
            debug('Initializing sidebar plugin')
            this.dom = this.createSidebarDOM()
            this.panelContainer = crelt('div', {
                class: 'cm-sidebar-panel-container',
            })
            this.dom.appendChild(this.panelContainer)
            view.dom.appendChild(this.dom)
            view.dom.style.position = 'relative'

            this.updateVisibility(view)
            this.applySidebarStyles(view)
            this.renderActivePanel(view)
            debug('Sidebar plugin initialized')
        }

        update(update: ViewUpdate) {
            const sidebar = update.state.field(sidebarState)

            if (
                sidebar.visible !==
                update.startState.field(sidebarState).visible
            ) {
                debug('Visibility changed:', sidebar.visible)
                this.updateVisibility(update.view)
            }
            if (
                sidebar.options !==
                update.startState.field(sidebarState).options
            ) {
                debug('Options changed:', sidebar.options)
                this.applySidebarStyles(update.view)
            }
            if (
                sidebar.activePanelId !==
                update.startState.field(sidebarState).activePanelId
            ) {
                debug('Active panel changed:', sidebar.activePanelId)
                this.renderActivePanel(update.view)
            }
        }

        destroy() {
            debug('Destroying sidebar plugin')
            this.dom.remove()
        }

        private createSidebarDOM(): HTMLElement {
            return crelt('div', { class: 'cm-sidebar' })
        }

        private updateVisibility(view: EditorView) {
            this.dom.style.display = view.state.field(sidebarState).visible
                ? 'block'
                : 'none'
        }

        private applySidebarStyles(view: EditorView) {
            const { width, backgroundColor } =
                view.state.field(sidebarState).options
            Object.assign(this.dom.style, {
                position: 'absolute',
                right: '0',
                top: '0',
                height: '100%',
                width: width,
                background: backgroundColor,
                zIndex: '10',
                padding: '10px 20px',
            })
        }

        private renderActivePanel(view: EditorView) {
            const sidebar = view.state.field(sidebarState)
            const panelSpecs = view.state.facet(sidebarPanel)

            debug('Rendering active panel:', sidebar.activePanelId)
            debug(
                'Available panels:',
                panelSpecs.map(spec => spec.id),
            )

            this.panelContainer.innerHTML = ''
            this.activePanel = null

            if (sidebar.activePanelId) {
                const panelSpec = panelSpecs.find(
                    spec => spec.id === sidebar.activePanelId,
                )
                if (panelSpec) {
                    debug('Found panel spec:', panelSpec.id)
                    this.activePanel = panelSpec.create(view)
                    this.panelContainer.appendChild(this.activePanel)
                    panelSpec.update?.(view)
                } else {
                    debug(
                        'Warning: No panel spec found for:',
                        sidebar.activePanelId,
                    )
                }
            }
        }
    },
)

// -- EXTENSION EXPORT --------------------------------------------------------
export const sidebar = [sidebarState, sidebarPlugin]

export type { SidebarPanelSpec, SidebarOptions }
export {
    toggleSidebarCommand,
    toggleSidebarEffect,
    sidebarState,
    sidebarPanel,
    updateSidebarOptionsEffect,
    setActivePanelEffect,
}
