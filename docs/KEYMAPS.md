# Keymaps

The `Keymaps` class provides a simple but powerful way to map key sequences to actions, similar to Vim's own `vim.keymap.set`.

## Core Concepts

-   **Modal**: Keymaps are stored separately for each editor mode (`NORMAL`, `INSERT`, `VISUAL`, etc.). This allows the same key (`d`) to perform different actions in different modes.
-   **Action-Oriented**: Each mapping consists of a key sequence (the "Left Hand Side" or `lhs`) and a function to execute (the "Right Hand Side" or `rhs`).
-   **Descriptive**: Mappings can include an optional `description`, which can be used for features like a help panel or command palette in the future.

## Public API

### `set(mode: Modes | Modes[], lhs: string, rhs: KeymapAction, opts?: KeymapOptions)`

This is the primary method for defining a keybinding.

-   `mode`: The mode(s) in which this keymap is active. Can be a single mode string or an array of strings.
-   `lhs`: The key sequence. Special keys are represented with angle brackets (e.g., `<Esc>`, `<C-c>`).
-   `rhs`: The function to call when the sequence is matched.
-   `opts`: Optional parameters, like `{ description: 'Do something' }`.

**Example from `src/keymaps.ts`:**

```typescript
// When 'i' is pressed in NORMAL mode, call the function to set the mode to INSERT.
keymaps.set('NORMAL', 'i', () => actions.setMode('INSERT'), { description: 'Enter Insert Mode' });

// The <Down> arrow key works in multiple modes.
const motionKeyModes: Modes[] = ['NORMAL', 'INSERT', 'VISUAL'];
keymaps.set(motionKeyModes, '<Down>', () => {
    const buffer = getActiveBuffer(container);
    if (buffer) cursor.moveDown(buffer, state.mode());
}, { description: 'Move Down' });
```

### `get(mode: Modes, lhs: string): Keymap | undefined`

Retrieves the keymap object for a given key in a specific mode. Used internally by the `InputManager`.

### `hasPrefix(mode: Modes, sequence: string): boolean`

Checks if a given sequence is a prefix of any longer registered keymap. This is crucial for the `InputManager` to decide whether to wait for more keys. For example, when `g` is pressed, `hasPrefix('NORMAL', 'g')` would return `true` because of the `gg` mapping.
