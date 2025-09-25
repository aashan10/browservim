import type { Modes } from '@lib/modes';

type KeymapAction = (...args: any[]) => void;

export interface KeymapOptions {
    description?: string;
}

export interface Keymap {
    action: KeymapAction;
    description?: string;
}

export class Keymaps {
    // The internal storage now holds a map of keys to Keymap objects
    private keymaps: Map<Modes, Map<string, Keymap>>;

    constructor() {
        this.keymaps = new Map();
    }

    /**
     * Sets a keybinding for a specific mode, similar to `vim.keymap.set`.
     * @param mode The editor mode (e.g., 'NORMAL', 'INSERT').
     * @param lhs The key or key sequence (Left Hand Side).
     * @param rhs The function to execute (Right Hand Side).
     * @param opts Additional options for the keymap.
     */
    public set(mode: Modes | Modes[], lhs: string, rhs: KeymapAction, opts?: KeymapOptions) {
        const modes = Array.isArray(mode) ? mode : [mode];

        for (const m of modes) {
            if (!this.keymaps.has(m)) {
                this.keymaps.set(m, new Map());
            }
            this.keymaps.get(m)!.set(lhs, {
                action: rhs,
                description: opts?.description,
            });
        }
    }

    /**
     * Retrieves the keymap object for a given key in a specific mode.
     * @param mode The editor mode.
     * @param lhs The key or key sequence.
     * @returns The keymap object or undefined if not found.
     */
    public get(mode: Modes, lhs: string): Keymap | undefined {
        return this.keymaps.get(mode)?.get(lhs);
    }

    /**
     * Checks if a given sequence is a prefix of any registered keymap in a given mode.
     * @param mode The editor mode.
     * @param sequence The sequence to check.
     * @returns True if it is a prefix, false otherwise.
     */
    public hasPrefix(mode: Modes, sequence: string): boolean {
        const modeKeymaps = this.keymaps.get(mode);
        if (!modeKeymaps) {
            return false;
        }

        for (const key of modeKeymaps.keys()) {
            if (key.startsWith(sequence) && key !== sequence) {
                return true;
            }
        }
        return false;
    }
}
