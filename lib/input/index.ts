import { Events, type EventBus } from '@lib/event-bus';
import type { Keymaps } from '@lib/keymaps';
import { state, actions } from '@lib/state';
import type { Cursor } from '@lib/cursor';
import type { BufferManager } from '@lib/buffer/manager';

export class InputManager {
    private keyQueue: string[] = [];
    private timerId: number | null = null;
    private readonly keyTimeout = 300; // ms

    constructor(
        private eventBus: EventBus,
        private keymaps: Keymaps,
        private container: any, // Using any to avoid circular dependency issues with Container type
    ) {
        this.eventBus.on(Events.KEYDOWN, this.handleKeyDown.bind(this));
    }

    private handleKeyDown(event: KeyboardEvent) {
        event.preventDefault();

        const key = this.keyboardEventToString(event);
        if (!key) return;

        // Check for a pending action first
        const pending = state.pendingAction();
        if (pending) {
            // We are waiting for the argument of a command like `f`
            if (pending.key === 'f' && key.length === 1) {
                const bufferManager = this.container.get<BufferManager>('BufferManager')!;
                const bufferId = state.activeBufferId();
                const buffer = bufferId ? bufferManager.get(bufferId) : null;
                const cursor = state.cursor();

                if (buffer) {
                    cursor.findChar(buffer, key);
                }
            } else if (pending.key === 'F' && key.length === 1) {
                const bufferManager = this.container.get<BufferManager>('BufferManager')!;
                const bufferId = state.activeBufferId();
                const buffer = bufferId ? bufferManager.get(bufferId) : null;
                const cursor = state.cursor();

                if (buffer) {
                    cursor.findCharBackward(buffer, key);
                }
            }
            actions.setPendingAction(null); // Clear the pending action
            this.clearQueue();
            return;
        }

        const mode = state.mode();

        // INSERT mode has its own distinct logic.
        if (mode === 'INSERT') {
            const keymap = this.keymaps.get(mode, key);
            if (keymap) {
                keymap.action();
            } else if (key.length === 1) {
                // Default behavior for INSERT mode is to insert the character.
                this.eventBus.emit(Events.ACTION_INSERT_CHAR, key);
            }
            this.clearQueue();
            return;
        }

        // --- Multi-key sequence logic for NORMAL, VISUAL, etc. ---
        this.clearTimer();
        this.keyQueue.push(key);

        const sequence = this.keyQueue.join('');
        const keymap = this.keymaps.get(mode, sequence);
        const isPrefix = this.keymaps.hasPrefix(mode, sequence);

        if (keymap && !isPrefix) {
            // Exact match and not a prefix of a longer command, execute immediately.
            keymap.action();
            this.clearQueue();
        } else if (keymap || isPrefix) {
            // A complete command that is also a prefix OR just a prefix.
            // Wait for more keys.
            this.timerId = window.setTimeout(() => this.processQueue(), this.keyTimeout);
        } else {
            // Invalid sequence, clear the queue.
            this.clearQueue();
        }
    }

    private processQueue() {
        const sequence = this.keyQueue.join('');
        const keymap = this.keymaps.get(state.mode(), sequence);
        if (keymap) {
            keymap.action();
        }
        this.clearQueue();
    }

    private clearQueue() {
        this.keyQueue = [];
        this.clearTimer();
    }

    private clearTimer() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    private keyboardEventToString(event: KeyboardEvent): string | null {
        const { key, ctrlKey, altKey, metaKey } = event;

        if (ctrlKey) {
            return `<C-${key}>`;
        }
        if (altKey) {
            return `<A-${key}>`;
        }
        if (metaKey) {
            return `<M-${key}>`;
        }

        switch (key) {
            case 'Escape':
                return '<Esc>';
            case 'Enter':
                return '<Enter>';
            case 'Tab':
                return '<Tab>';
            case 'Backspace':
                return '<BS>';
            case 'ArrowUp':
                return '<Up>';
            case 'ArrowDown':
                return '<Down>';
            case 'ArrowLeft':
                return '<Left>';
            case 'ArrowRight':
                return '<Right>';
        }

        if (key.length === 1) {
            return key;
        }

        return null;
    }
}
