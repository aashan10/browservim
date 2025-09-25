# State

The application's state management is centralized in `lib/state/index.ts`. It uses the custom reactivity system to create a global, reactive store.

## Core Concepts

-   **Signals**: Each piece of state is a `signal`, created with `createSignal`. A signal is a pair of a getter and a setter.
-   **Separation of Concerns**: The module exports the reactive state getters in a `state` object and the state setters in an `actions` object. This encourages a pattern where mutations are only performed through explicit actions.
-   **Derived State (Memos)**: Some state is derived from other state. For this, `createMemo` is used. A memo is a signal that automatically re-computes its value when its dependencies change.

## Core State Signals

-   `mode`: The current editor mode (e.g., `'NORMAL'`, `'INSERT'`).
-   `activeBufferId`: The ID of the buffer currently being displayed.
-   `cursor`: An instance of the `Cursor` class. The cursor's internal row/col are also signals.
-   `pendingAction`: Holds state for multi-part commands, like `f` (find).
-   `selectionAnchor`: The position where a `VISUAL` mode selection started.

## Derived State: `selection`

The `selection` state is a `memo` that depends on the `selectionAnchor` and the `cursor`'s position. Its job is to provide a normalized `Selection` object.

```typescript
const selection = createMemo<Selection | null>(() => {
    const anchor = selectionAnchor();
    const head = { row: cursor().row(), col: cursor().col() };

    if (!anchor) {
        return null;
    }

    // Normalize so that 'start' is always before 'end'
    if (anchor.row > head.row || (anchor.row === head.row && anchor.col > head.col)) {
        return { start: head, end: anchor };
    }
    return { start: anchor, end: head };
});
```

This is powerful because any component that uses `state.selection()` will automatically update whenever the cursor moves or the anchor changes, without needing to manually recalculate the selection range.
