import { ViewPlugin, EditorView, ViewUpdate } from '@codemirror/view'
import {
    StateField,
    StateEffect,
    Facet,
    type Extension,
} from '@codemirror/state'
import crelt from 'crelt'
import { styles, inlineStyles, defaultSidebarOptions } from './styles'
import logger from '../utils/logger'

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
    initiallyOpen?: boolean // Whether the sidebar should be open by default
    initialPanelId?: string // The ID of the panel to show when initially opened
}

interface SidebarState {
    visible: boolean
    options: SidebarOptions
    activePanelId: string | null
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
            visible: initialOptions.initiallyOpen ?? false,
            options: initialOptions,
            activePanelId:
                initialOptions.initiallyOpen && initialOptions.initialPanelId
                    ? initialOptions.initialPanelId
                    : null,
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
const debug = (...args: unknown[]) =>
    logger.debug({ module: 'Sidebar' }, args.join(' '))

const createSidebarPlugin = (id: string) =>
    ViewPlugin.fromClass(
        class {
            dom: HTMLElement
            panelContainer: HTMLElement
            activePanel: HTMLElement | null = null
            resizeHandle: HTMLElement
            initialWidth: number = 0
            initialX: number = 0
            isDragging: boolean = false

            constructor(view: EditorView) {
                debug('Initializing sidebar plugin:', id)
                this.dom = this.createSidebarDOM()
                this.panelContainer = crelt('div', {
                    class: styles.panelContainer,
                })
                this.resizeHandle = this.createResizeHandle()
                this.dom.appendChild(this.resizeHandle)
                this.dom.appendChild(this.panelContainer)

                // Apply styles before adding to DOM to prevent flash of visible content
                const stateField = sidebarStates.get(id)!
                const state = view.state.field(stateField)
                this.applySidebarStyles(state.options, state.visible)
                this.updateVisibility(state.visible)

                view.dom.appendChild(this.dom)
                view.dom.style.position = 'relative'
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
                    this.applySidebarStyles(state.options, state.visible)
                }
                if (state.options !== oldState.options) {
                    debug('Options changed:', id, state.options)
                    this.applySidebarStyles(state.options, state.visible)
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
                    class: styles.sidebar,
                    'data-sidebar-id': id,
                })
            }

            private updateVisibility(visible: boolean) {
                this.dom.style.display = visible ? 'block' : 'none'
            }

            private createResizeHandle(): HTMLElement {
                const handle = crelt('div', {
                    class: styles.resizeHandle,
                })

                // Set up resize handle styles
                Object.assign(handle.style, inlineStyles.resizeHandle)

                const startDragging = (e: MouseEvent) => {
                    e.preventDefault()
                    this.isDragging = true
                    this.initialX = e.clientX
                    this.initialWidth = this.dom.offsetWidth

                    // Add event listeners for dragging
                    document.addEventListener('mousemove', onDrag)
                    document.addEventListener('mouseup', stopDragging)
                    Object.assign(document.body.style, inlineStyles.dragging)
                }

                const onDrag = (e: MouseEvent) => {
                    if (!this.isDragging) return

                    const stateField = sidebarStates.get(id)!
                    // Find the EditorView instance
                    const editorElement = this.dom.closest(
                        '.cm-editor',
                    ) as HTMLElement
                    if (!editorElement) return
                    const view = EditorView.findFromDOM(editorElement)
                    if (!view) return

                    const state = view.state.field(stateField)
                    const delta = e.clientX - this.initialX
                    let newWidth =
                        state.options.dock === 'left'
                            ? this.initialWidth + delta
                            : this.initialWidth - delta

                    // Enforce minimum and maximum width
                    newWidth = Math.max(150, Math.min(800, newWidth))

                    this.dom.style.width = `${newWidth}px`

                    // Update the state with the new width
                    view.dispatch({
                        effects: updateSidebarOptionsEffect.of({
                            ...state.options,
                            width: `${newWidth}px`,
                        }),
                    })
                }

                const stopDragging = () => {
                    this.isDragging = false
                    document.removeEventListener('mousemove', onDrag)
                    document.removeEventListener('mouseup', stopDragging)
                    document.body.style.cursor = ''
                    document.body.style.userSelect = ''
                }

                handle.addEventListener('mousedown', startDragging)
                return handle
            }

            private applySidebarStyles(
                options: SidebarOptions,
                visible: boolean,
            ) {
                const { width, backgroundColor, dock, overlay } = options
                const editor = this.dom.parentElement

                if (editor) {
                    Object.assign(
                        editor.style,
                        overlay
                            ? inlineStyles.editor.overlay
                            : inlineStyles.editor.nonOverlay,
                    )
                }

                // Apply base sidebar styles
                Object.assign(this.dom.style, {
                    ...inlineStyles.sidebar.base,
                    background: backgroundColor,
                })

                // Position the resize handle based on dock position
                Object.assign(this.resizeHandle.style, {
                    [dock === 'left' ? 'right' : 'left']: '-2px',
                })

                if (!overlay) {
                    Object.assign(this.dom.style, {
                        ...inlineStyles.sidebar.nonOverlay,
                        order: dock === 'left' ? -1 : 1,
                        width: visible ? width : '0',
                        opacity: visible ? '1' : '0',
                    })
                } else {
                    Object.assign(this.dom.style, {
                        ...inlineStyles.sidebar.overlay,
                        [dock === 'left' ? 'left' : 'right']: visible
                            ? '0'
                            : `-${width}`,
                        width: width,
                    })
                }

                if (!overlay && editor) {
                    const editorContent = editor.querySelector(
                        '.cm-scroller',
                    ) as HTMLElement
                    if (editorContent) {
                        Object.assign(
                            editorContent.style,
                            inlineStyles.editorContent,
                        )
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
        // Update the listener to use the initialPanelId from options
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
                            panelId: mergedOptions.initialPanelId ?? null,
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
