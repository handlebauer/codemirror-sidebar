import { ViewPlugin, EditorView, ViewUpdate } from '@codemirror/view'
import {
    StateField,
    StateEffect,
    Facet,
    type Extension,
} from '@codemirror/state'
import crelt from 'crelt'

// -- TYPES ---------------------------------------------------------------
interface SidebarPanelSpec {
    id: string
    create: (view: EditorView) => HTMLElement
    update?: (view: EditorView) => void
    destroy?: (view: EditorView) => void
}

type DockPosition = 'left' | 'right'

interface SidebarOptions {
    width?: string
    backgroundColor?: string
    dock?: DockPosition
    id: string // Make id required
}

interface SidebarState {
    visible: boolean
    options: SidebarOptions
    activePanelId: string | null
}

// -- CONSTANTS -----------------------------------------------------------
const defaultSidebarOptions: Omit<SidebarOptions, 'id'> = {
    width: '250px',
    backgroundColor: '#21222c',
}

// -- FACETS ------------------------------------------------------------
const sidebarPanel = Facet.define<SidebarPanelSpec, SidebarPanelSpec[]>({
    combine: values => values.flat(),
})

// -- STATE EFFECTS ----------------------------------------------------------
interface ToggleEffectConfig {
    id: string
    visible: boolean
}

interface SetActivePanelConfig {
    id: string
    panelId: string | null
}

const toggleSidebarEffect = StateEffect.define<ToggleEffectConfig>()
const updateSidebarOptionsEffect = StateEffect.define<SidebarOptions>()
const setActivePanelEffect = StateEffect.define<SetActivePanelConfig>()

// Store state fields for each sidebar
const sidebarStates = new Map<string, StateField<SidebarState>>()

// Create a function to generate a unique state field for each sidebar
const createSidebarState = (id: string) => {
    return StateField.define<SidebarState>({
        create: () => ({
            visible: false,
            options: { ...defaultSidebarOptions, id },
            activePanelId: null,
        }),
        update(value, tr) {
            let newState = value
            debug('updateSidebarState', newState)
            for (const e of tr.effects) {
                if (e.is(toggleSidebarEffect) && e.value.id === id) {
                    newState = { ...newState, visible: e.value.visible }
                } else if (
                    e.is(updateSidebarOptionsEffect) &&
                    e.value.id === id
                ) {
                    newState = {
                        ...newState,
                        options: { ...newState.options, ...e.value },
                    }
                } else if (e.is(setActivePanelEffect) && e.value.id === id) {
                    newState = {
                        ...newState,
                        activePanelId: e.value.panelId,
                    }
                }
            }
            return newState
        },
    })
}

// -- COMMANDS ---------------------------------------------------------------
const toggleSidebarCommand = (view: EditorView, sidebarId: string) => {
    // Find the state field for this sidebar
    const stateField = sidebarStates.get(sidebarId)
    if (!stateField) {
        debug('No state field for sidebar:', sidebarId)
        return false
    }

    const state = view.state.field(stateField)
    view.dispatch({
        effects: toggleSidebarEffect.of({
            id: sidebarId,
            visible: !state.visible,
        }),
    })
    return true
}

// -- VIEW PLUGIN ------------------------------------------------------------
const debug = (...args: unknown[]) => console.log('[Sidebar]', ...args)

const createSidebarPlugin = (id: string) =>
    ViewPlugin.fromClass(
        class {
            dom: HTMLElement
            panelContainer: HTMLElement
            activePanel: HTMLElement | null = null

            constructor(view: EditorView) {
                debug('Initializing sidebar plugin:', id)
                this.dom = this.createSidebarDOM()
                this.panelContainer = crelt('div', {
                    class: 'cm-sidebar-panel-container',
                })
                this.dom.appendChild(this.panelContainer)
                view.dom.appendChild(this.dom)
                view.dom.style.position = 'relative'

                const stateField = sidebarStates.get(id)!
                const state = view.state.field(stateField)
                this.updateVisibility(state.visible)
                this.applySidebarStyles(state.options)
                this.renderActivePanel(view, state)
                debug('Sidebar plugin initialized:', id)
            }

            update(update: ViewUpdate) {
                const stateField = sidebarStates.get(id)!
                const state = update.state.field(stateField)
                const oldState = update.startState.field(stateField)

                if (state.visible !== oldState.visible) {
                    debug('Visibility changed:', id, state.visible)
                    this.updateVisibility(state.visible)
                }
                if (state.options !== oldState.options) {
                    debug('Options changed:', id, state.options)
                    this.applySidebarStyles(state.options)
                }
                if (state.activePanelId !== oldState.activePanelId) {
                    debug('Active panel changed:', id, state.activePanelId)
                    this.renderActivePanel(update.view, state)
                }
            }

            destroy() {
                debug('Destroying sidebar plugin:', id)
                this.dom.remove()
            }

            private createSidebarDOM(): HTMLElement {
                return crelt('div', {
                    class: 'cm-sidebar',
                    'data-sidebar-id': id,
                })
            }

            private updateVisibility(visible: boolean) {
                this.dom.style.display = visible ? 'block' : 'none'
            }

            private applySidebarStyles(options: SidebarOptions) {
                const { width, backgroundColor, dock } = options
                Object.assign(this.dom.style, {
                    position: 'absolute',
                    [dock === 'left' ? 'left' : 'right']: '0',
                    top: '0',
                    height: '100%',
                    width: width,
                    background: backgroundColor,
                    zIndex: '10',
                    padding: '10px 20px',
                })
            }

            private renderActivePanel(view: EditorView, state: SidebarState) {
                const panelSpecs = view.state.facet(sidebarPanel)

                debug('Rendering active panel:', id, state.activePanelId)
                debug(
                    'Available panels:',
                    panelSpecs.map(spec => spec.id),
                )

                this.panelContainer.innerHTML = ''
                this.activePanel = null

                if (state.activePanelId) {
                    const panelSpec = panelSpecs.find(
                        spec => spec.id === state.activePanelId,
                    )
                    if (panelSpec) {
                        debug('Found panel spec:', panelSpec.id)
                        this.activePanel = panelSpec.create(view)
                        this.panelContainer.appendChild(this.activePanel)
                        panelSpec.update?.(view)
                    } else {
                        debug(
                            'Warning: No panel spec found for:',
                            state.activePanelId,
                        )
                    }
                }
            }
        },
    )

// Function to create a sidebar extension
export function createSidebar(options: SidebarOptions): Extension[] {
    const { id } = options
    const mergedOptions = { ...defaultSidebarOptions, ...options }

    // Create a new state field for this sidebar if it doesn't exist
    if (!sidebarStates.has(id)) {
        sidebarStates.set(id, createSidebarState(id))
    }

    const stateField = sidebarStates.get(id)!

    return [
        stateField,
        createSidebarPlugin(id),
        // Initial options
        EditorView.updateListener.of(update => {
            const hasToggleEffect = update.transactions.some(tr =>
                tr.effects.some(
                    e =>
                        e.is(toggleSidebarEffect) &&
                        e.value.id === id &&
                        e.value.visible,
                ),
            )

            // Dispatch initial options
            if (update.transactions.length === 0) {
                update.view.dispatch({
                    effects: updateSidebarOptionsEffect.of(mergedOptions),
                })
            }

            if (hasToggleEffect) {
                update.view.dispatch({
                    effects: [
                        setActivePanelEffect.of({
                            id,
                            panelId:
                                mergedOptions.dock === 'left'
                                    ? 'file-explorer'
                                    : 'ai-assistant',
                        }),
                    ],
                })
            }
        }),
    ]
}

export type { SidebarPanelSpec, SidebarOptions, DockPosition }
export {
    toggleSidebarCommand,
    toggleSidebarEffect,
    sidebarPanel,
    updateSidebarOptionsEffect,
    setActivePanelEffect,
}
