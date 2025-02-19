import { ViewPlugin, EditorView, ViewUpdate } from '@codemirror/view'
import {
    StateField,
    StateEffect,
    Facet,
    type Extension,
} from '@codemirror/state'
import crelt from 'crelt'
import { styles, defaultSidebarOptions } from './styles'
import { sidebarTheme, sidebarThemeVariables } from '../themes/sidebar'
import logger from '../utils/logger'

// -- TYPES ---------------------------------------------------------------
interface SidebarPanelSpec {
    id: string
    create: (view: EditorView) => HTMLElement
    update?: (view: EditorView) => void
    destroy?: (view: EditorView) => void
    onVisibilityChange?: (view: EditorView, visible: boolean) => void
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
    const newVisible = !state.visible
    debug(
        'Toggling sidebar:',
        sidebarId,
        'from:',
        state.visible,
        'to:',
        newVisible,
    )

    // When opening the sidebar, ensure we have an active panel
    const effects: StateEffect<unknown>[] = [
        toggleSidebarEffect.of({
            id: sidebarId,
            visible: newVisible,
        }),
    ]

    // If we're opening the sidebar and there's no active panel,
    // set the panel matching this sidebar's ID as active
    if (newVisible && !state.activePanelId) {
        const panels = view.state.facet(sidebarPanel)
        const panel = panels.find(p => p.id === sidebarId)
        if (panel) {
            effects.push(
                setActivePanelEffect.of({
                    id: sidebarId,
                    panelId: panel.id,
                }),
            )
        }
    }

    view.dispatch({ effects })
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
                this.dom = crelt('div', {
                    class: styles.sidebar,
                    'data-sidebar-id': id,
                })
                this.panelContainer = crelt('div', {
                    class: styles.panelContainer,
                })
                this.resizeHandle = crelt('div', {
                    class: styles.resizeHandle,
                })

                this.dom.appendChild(this.resizeHandle)
                this.dom.appendChild(this.panelContainer)

                // Apply styles before adding to DOM to prevent flash of visible content
                const stateField = sidebarStates.get(id)!
                const state = view.state.field(stateField)
                this.applySidebarStyles(state.options)
                this.updateVisibility(state.visible)

                view.dom.appendChild(this.dom)
                view.dom.style.position = 'relative'
                this.renderActivePanel(view, state)

                // Set up resize handle
                this.setupResizeHandle()
            }

            update(update: ViewUpdate) {
                const stateField = sidebarStates.get(id)!
                const state = update.state.field(stateField)
                const oldState = update.startState.field(stateField)

                if (state.visible !== oldState.visible) {
                    debug('Visibility changed:', id, state.visible)
                    this.applySidebarStyles(state.options)
                    this.updateVisibility(state.visible)

                    // If sidebar is being hidden, return focus to editor
                    if (!state.visible) {
                        update.view.focus()
                    }

                    // Notify panel of visibility change
                    const panels = update.state.facet(sidebarPanel)
                    const activePanel = panels.find(
                        p => p.id === state.activePanelId,
                    )
                    if (activePanel?.onVisibilityChange) {
                        activePanel.onVisibilityChange(
                            update.view,
                            state.visible,
                        )
                    }
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

            private updateVisibility(visible: boolean) {
                this.dom.setAttribute('data-visible', visible.toString())
            }

            private setupResizeHandle() {
                const startDragging = (e: MouseEvent) => {
                    e.preventDefault()
                    this.isDragging = true
                    this.initialX = e.clientX
                    this.initialWidth = this.dom.offsetWidth

                    // Add event listeners for dragging
                    document.addEventListener('mousemove', onDrag)
                    document.addEventListener('mouseup', stopDragging)
                    document.body.classList.add('cm-ext-sidebar-dragging')
                }

                const onDrag = (e: MouseEvent) => {
                    if (!this.isDragging) return

                    const stateField = sidebarStates.get(id)!
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
                    const minWidth = parseInt(
                        sidebarThemeVariables['--cm-ext-sidebar-min-width'],
                    )
                    const maxWidth = parseInt(
                        sidebarThemeVariables['--cm-ext-sidebar-max-width'],
                    )
                    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))

                    // Update CSS variable
                    this.dom.style.setProperty(
                        '--cm-ext-sidebar-width',
                        `${newWidth}px`,
                    )
                }

                const stopDragging = () => {
                    if (!this.isDragging) return
                    this.isDragging = false

                    // Remove event listeners
                    document.removeEventListener('mousemove', onDrag)
                    document.removeEventListener('mouseup', stopDragging)
                    document.body.classList.remove('cm-ext-sidebar-dragging')

                    // Update state with new width
                    const stateField = sidebarStates.get(id)!
                    const editorElement = this.dom.closest(
                        '.cm-editor',
                    ) as HTMLElement
                    if (!editorElement) return
                    const view = EditorView.findFromDOM(editorElement)
                    if (!view) return

                    view.dispatch({
                        effects: updateSidebarOptionsEffect.of({
                            ...view.state.field(stateField).options,
                            width: this.dom.style.getPropertyValue(
                                '--cm-ext-sidebar-width',
                            ),
                        }),
                    })
                }

                this.resizeHandle.addEventListener('mousedown', startDragging)
            }

            private applySidebarStyles(options: SidebarOptions) {
                const {
                    width,
                    backgroundColor,
                    dock = 'left',
                    overlay = true,
                } = options

                // Set data attributes for theme-based positioning
                this.dom.setAttribute('data-dock', dock)
                this.dom.setAttribute('data-overlay', overlay.toString())
                this.panelContainer.setAttribute('data-dock', dock)

                // Update CSS variables
                if (width) {
                    this.dom.style.setProperty('--cm-ext-sidebar-width', width)
                }
                if (backgroundColor) {
                    this.dom.style.setProperty(
                        '--cm-ext-sidebar-bg',
                        backgroundColor,
                    )
                }

                // Position resize handle based on dock position
                if (dock === 'left') {
                    this.resizeHandle.style.left = 'auto'
                    this.resizeHandle.style.right = '-2px'
                } else {
                    this.resizeHandle.style.left = '-2px'
                    this.resizeHandle.style.right = 'auto'
                }

                // Apply minimal editor layout styles
                const editor = this.dom.closest('.cm-editor') as HTMLElement
                if (editor) {
                    editor.style.position = 'relative'
                }
            }

            private renderActivePanel(view: EditorView, state: SidebarState) {
                // Clear existing panel
                if (this.activePanel) {
                    this.activePanel.remove()
                    this.activePanel = null
                }

                // Find and render new panel
                if (state.activePanelId) {
                    const panels = view.state.facet(sidebarPanel)
                    const panel = panels.find(p => p.id === state.activePanelId)
                    if (panel) {
                        this.activePanel = panel.create(view)
                        this.panelContainer.appendChild(this.activePanel)
                    }
                }
            }
        },
    )

export function createSidebar(options: SidebarOptions): Extension[] {
    const id = options.id
    const stateField = createSidebarState(id, {
        ...defaultSidebarOptions,
        ...options,
    })

    // Store the state field for this sidebar
    sidebarStates.set(id, stateField)

    return [stateField, createSidebarPlugin(id), sidebarTheme.theme]
}

export type { SidebarPanelSpec, SidebarOptions, DockPosition }
export {
    toggleSidebarCommand,
    toggleSidebarEffect,
    sidebarPanel,
    updateSidebarOptionsEffect,
    setActivePanelEffect,
}
