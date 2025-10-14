import type { Container } from '@lib/container';
import type { Keymaps, KeymapAction, KeymapOptions } from '@lib/keymaps';
import type { Modes } from '@lib/modes';
import type { Renderer } from '@lib/renderer';
import type { StatusBarManager, StatusBarComponent } from '@lib/statusbar';
import type { EventBus } from '@lib/event-bus';
import { state as allState } from '@lib/state';

/**
 * A curated, secure API for plugins to interact with the editor's core systems.
 * This object is passed to a plugin's `install` method.
 */
export class PluginAPI {
    constructor(private container: Container) {}

    /**
     * Registers a callback to be executed at the end of every render frame.
     * This allows a plugin to draw custom content on top of the editor UI.
     * @param callback The function to call, which receives the canvas rendering context.
     */
    addPostDrawHook(callback: (ctx: CanvasRenderingContext2D) => void) {
        const renderer = this.container.get<Renderer>('Renderer');
        renderer?.addPostDrawHook(callback);
    }

    /**
     * Registers a keymap for a given mode.
     * @param mode The mode(s) for the keymap.
     * @param lhs The key sequence.
     * @param rhs The action to perform.
     * @param opts Optional description.
     */
    registerKeymap(mode: Modes | Modes[], lhs: string, rhs: KeymapAction, opts?: KeymapOptions) {
        const keymaps = this.container.get<Keymaps>('Keymaps');
        keymaps?.set(mode, lhs, rhs, opts);
    }

    /**
     * Adds a reactive component to the status bar.
     * @param component A function that returns the string to display.
     * @param alignment Whether to add it to the 'left' or 'right' side.
     */
    addStatusBarComponent(component: StatusBarComponent, alignment: 'left' | 'right') {
        const statusBar = this.container.get<StatusBarManager>('StatusBarManager');
        if (alignment === 'left') {
            statusBar?.addLeft(component);
        } else {
            statusBar?.addRight(component);
        }
    }

    /**
     * Subscribes to a global editor event.
     * @param event The name of the event.
     * @param listener The callback to execute.
     */
    on(event: string, listener: (...args: any[]) => void) {
        const eventBus = this.container.get<EventBus>('EventBus');
        eventBus?.on(event, listener);
    }

    /**
     * Provides read-only access to the editor's global reactive state.
     * @returns A read-only state object.
     */
    getState() {
        return allState;
    }
}
