import { keymap, type KeyBinding } from '@codemirror/view'
import { type Extension } from '@codemirror/state'
import { toggleSidebarCommand } from './index'
import logger from '../utils/logger'

const debug = (...args: unknown[]) => logger.debug('[Sidebar Keymap]', ...args)

/**
 * Creates keymap bindings for toggling a sidebar
 */
function createSidebarBindings(
    sidebarId: string,
    key: string | { mac?: string; win?: string },
): KeyBinding[] {
    const bindings: KeyBinding[] = []
    debug('Creating keymap bindings for sidebar:', sidebarId, key)

    if (typeof key === 'string') {
        debug('Adding universal key binding:', key)
        bindings.push({
            key,
            run: view => {
                debug('Triggered universal key binding:', key)
                return toggleSidebarCommand(view, sidebarId)
            },
        })
    } else {
        if (key.mac) {
            debug('Adding Mac key binding:', key.mac)
            bindings.push({
                mac: key.mac,
                run: view => {
                    debug('Triggered Mac key binding:', key.mac)
                    return toggleSidebarCommand(view, sidebarId)
                },
            })
        }
        if (key.win) {
            debug('Adding Windows key binding:', key.win)
            bindings.push({
                win: key.win,
                run: view => {
                    debug('Triggered Windows key binding:', key.win)
                    return toggleSidebarCommand(view, sidebarId)
                },
            })
        }
    }

    return bindings
}

/**
 * Creates a keymap extension for a sidebar
 */
export function createSidebarKeymap(
    sidebarId: string,
    keymapConfig?: string | { mac?: string; win?: string },
): Extension {
    if (!keymapConfig) {
        debug('No keymap config provided for sidebar:', sidebarId)
        return []
    }
    debug('Creating keymap extension for sidebar:', sidebarId, keymapConfig)
    return keymap.of(createSidebarBindings(sidebarId, keymapConfig))
}
