import { createSignal, createMemo } from '@lib/reactivity';
import type { Modes } from '@lib/modes';
import { Cursor } from '@lib/cursor';

// --- Types ---
export interface PendingAction {
    key: 'f' | 'F';
}

export interface Position {
    row: number;
    col: number;
}

export interface Selection {
    start: Position;
    end: Position;
}

// --- Reactive State Signals ---
const [mode, setMode] = createSignal<Modes>('NORMAL');
const [activeBufferId, setActiveBufferId] = createSignal<string | null>(null);
const [cursor, setCursor] = createSignal<Cursor>(new Cursor());
const [pendingAction, setPendingAction] = createSignal<PendingAction | null>(null);
const [selectionAnchor, setSelectionAnchor] = createSignal<Position | null>(null);

// --- Derived State (Memos) ---

// A derived signal that represents the current selection range.
// It normalizes the anchor and cursor position so that 'start' is always before 'end'.
const selection = createMemo<Selection | null>(() => {
    const anchor = selectionAnchor();
    const head = { row: cursor().row(), col: cursor().col() };

    if (!anchor) {
        return null;
    }

    // Normalize the selection
    if (anchor.row > head.row || (anchor.row === head.row && anchor.col > head.col)) {
        return { start: head, end: anchor };
    }
    return { start: anchor, end: head };
});


// --- Exporting ---
export const state = {
    mode,
    activeBufferId,
    cursor,
    pendingAction,
    selectionAnchor,
    selection,
};

export const actions = {
    setMode,
    setActiveBufferId,
    setCursor,
    setPendingAction,
    setSelectionAnchor,
    setCursorPosition: (pos: Position) => {
        const cursor = state.cursor();
        cursor.setRow(pos.row);
        cursor.setCol(pos.col);
    },
};