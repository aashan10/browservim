# Extending nvim.ts

Due to its modular architecture, adding new functionality is straightforward. This guide shows how to add a new command.

## Example: Adding a `dd` Command to Delete a Line

Here are the steps to implement the `dd` command in `NORMAL` mode.

### 1. Add the Core Logic (if needed)

The `dd` command needs to delete a line from the buffer. A method for this might not exist yet. Let's add it to `lib/buffer/index.ts`.

```typescript
// In lib/buffer/index.ts, inside the Buffer class

public deleteLine(row: number) {
    const lines = [...this.getLines()];
    if (row < 0 || row >= lines.length) return;

    lines.splice(row, 1);

    // If we delete the last line, add an empty line back
    if (lines.length === 0) {
        lines.push('');
    }

    this.setLines(lines);
}
```

### 2. Register the Keymap

Now, we map the `dd` key sequence to an action in `src/keymaps.ts`. This action will call our new buffer method.

Find a suitable place in `src/keymaps.ts`, for example, within `registerOperatorActions`.

```typescript
// In src/keymaps.ts

function registerOperatorActions(keymaps: Keymaps, container: Container) {
    const cursor = state.cursor();

    // ... existing keymaps

    // Add the new dd keymap for NORMAL mode
    keymaps.set('NORMAL', 'dd', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) {
            const currentRow = cursor.row();
            buffer.deleteLine(currentRow);

            // After deleting, move cursor to the start of the line
            // and ensure it's not out of bounds.
            const lineCount = buffer.getLines().length;
            if (currentRow >= lineCount) {
                cursor.setRow(lineCount - 1);
            }
            cursor.setCol(0);
        }
    }, { description: 'Delete current line' });
}
```

### 3. Test It!

That's it. Because the system is reactive, no other changes are needed:

1.  The `InputManager` will now recognize `dd` as a valid command.
2.  When `dd` is pressed, the keymap's action is called.
3.  The action calls `buffer.deleteLine()`, which updates the buffer's reactive `lines` signal.
4.  The `Renderer`'s `createEffect` is subscribed to changes in the buffer's lines, so it automatically re-runs and draws the updated scene to the canvas.

This same process applies to almost any new feature:

1.  **Add Logic**: Implement the core functionality (usually in `Buffer` or `Cursor`).
2.  **Define Action**: Create a function that calls the logic and updates the state via `actions`.
3.  **Register Keymap**: Map a key sequence to your new action in `src/keymaps.ts`.
