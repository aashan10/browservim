# Input Manager

The `InputManager` is the heart of the Vim emulation. It is responsible for capturing raw keyboard events and translating them into meaningful commands based on the current editor mode and key sequence.

## Core Concepts

### Key Sequence Timeout

Vim commands can be composed of multiple keystrokes (e.g., `gg`, `dd`). The `InputManager` handles this with a queue and a timeout.

1.  When a key is pressed in a command mode (like `NORMAL`), it's added to a `keyQueue`.
2.  The manager checks if the current sequence in the queue is a valid command (e.g., `g`).
3.  It also checks if the sequence is a *prefix* of a longer command (e.g., `g` is a prefix of `gg`).
4.  If it's a prefix, it starts a short timer (`keyTimeout`). If another key is pressed within the timeout, it's added to the queue.
5.  If the timer expires, the manager processes the command that was in the queue.
6.  If a sequence is a complete command and *not* a prefix, it's executed immediately.

This allows the editor to distinguish between `g` (if it were a command) and `gg`.

### Pending Actions

Some Vim commands require a subsequent character as an argument. For example, the `f` (find) command requires a character to find (e.g., `fa` finds the next 'a').

-   When a command like `f` is triggered, it sets a `pendingAction` in the global state.
-   The `InputManager` checks for this pending action on the next keypress.
-   If a pending action exists, it uses the next key as the argument for the action (e.g., finding the character) instead of processing it as a normal command.
-   After the action is complete, the `pendingAction` state is cleared.

### Mode-Specific Handling

-   **`INSERT` Mode**: Input handling is simple. Most keys are inserted directly as characters. Special keys like `<Esc>` or `<BS>` are handled by specific keymaps.
-   **`NORMAL` / `VISUAL` Modes**: Input is processed through the key sequence and timeout logic described above.
