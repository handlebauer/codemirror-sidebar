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
    overlay?: boolean // Whether the sidebar overlays the editor or pushes it
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
    overlay: true, // Default to overlay behavior
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
const createSidebarState = (id: string, initialOptions: SidebarOptions) => {
    return StateField.define<SidebarState>({
        create: () => ({
            visible: false,
            options: initialOptions, // use the provided options here
            activePanelId: null,
        }),
        update(value, tr) {
            let newState = value
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
                const { width, backgroundColor, dock, overlay } = options
                const editor = this.dom.parentElement

                if (editor) {
                    if (!overlay) {
                        // make the CodeMirror container a flexbox so that its children (the editor and sidebar) are flex items
                        Object.assign(editor.style, {
                            display: 'flex',
                            flexDirection: 'row',
                            position: 'relative',
                            height: '100%',
                        })
                    } else {
                        Object.assign(editor.style, {
                            display: 'block',
                            position: 'relative',
                        })
                    }
                }

                if (!overlay) {
                    // In non-overlay mode, let the sidebar be part of the flex flow.
                    // Use flex order to put it on the left or right.
                    Object.assign(this.dom.style, {
                        position: 'relative',
                        order: dock === 'left' ? -1 : 1,
                        height: '100%',
                        width: width,
                        background: backgroundColor,
                        zIndex: '1',
                        padding: '10px 20px',
                        flexShrink: '0',
                        display: 'flex',
                        flexDirection: 'column',
                    })
                } else {
                    // Overlay mode: position absolutely
                    Object.assign(this.dom.style, {
                        position: 'absolute',
                        [dock === 'left' ? 'left' : 'right']: '0',
                        top: '0',
                        height: '100%',
                        width: width,
                        background: backgroundColor,
                        zIndex: '10',
                        padding: '10px 20px',
                        flexShrink: '0',
                        display: 'flex',
                        flexDirection: 'column',
                    })
                }

                // Ensure the editor content takes the remaining space in non-overlay mode.
                if (!overlay && editor) {
                    const editorContent = editor.querySelector(
                        '.cm-scroller',
                    ) as HTMLElement
                    if (editorContent) {
                        Object.assign(editorContent.style, {
                            flex: '1',
                            width: 'auto',
                            position: 'relative',
                        })
                    }
                }
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
        sidebarStates.set(id, createSidebarState(id, mergedOptions))
    }
    const stateField = sidebarStates.get(id)!

    return [
        stateField,
        createSidebarPlugin(id),
        // (Optional: you can keep the updateListener for things like panel switching)
        EditorView.updateListener.of(update => {
            const hasToggleEffect = update.transactions.some(tr =>
                tr.effects.some(
                    e =>
                        e.is(toggleSidebarEffect) &&
                        e.value.id === id &&
                        e.value.visible,
                ),
            )
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
