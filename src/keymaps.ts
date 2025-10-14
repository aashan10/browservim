import type { Container } from '@lib/container';
import type { Keymaps } from '@lib/keymaps';
import { Events, type EventBus } from '@lib/event-bus';
import type { BufferManager } from '@lib/buffer/manager';
import type { Modes } from '@lib/modes';
import { state, actions } from '@lib/state';

// Helper function to avoid repetition
const getActiveBuffer = (container: Container) => {
    const bufferManager = container.get<BufferManager>('BufferManager')!;
    const bufferId = state.activeBufferId();
    return bufferId ? bufferManager.get(bufferId) : null;
};

function registerModeSwitches(keymaps: Keymaps, container: Container) {
    const cursor = state.cursor();

    // --- Mode Switching ---
    keymaps.set('NORMAL', 'i', () => {
        const buffer = getActiveBuffer(container);
        if (buffer && !buffer.config.readonly) {
            actions.setMode('INSERT');
        }
    }, { description: 'Enter Insert Mode' });
    keymaps.set('INSERT', '<Esc>', () => actions.setMode('NORMAL'), { description: 'Enter Normal Mode' });
    keymaps.set('NORMAL', 'v', () => {
        actions.setMode('VISUAL');
        actions.setSelectionAnchor({ row: cursor.row(), col: cursor.col() });
    }, { description: 'Enter Visual Mode' });
    keymaps.set('VISUAL', '<Esc>', () => {
        actions.setMode('NORMAL');
        actions.setSelectionAnchor(null);
    }, { description: 'Exit Visual Mode' });

    const commandModeKeys: Modes[] = ['NORMAL', 'VISUAL'];
    keymaps.set(commandModeKeys, ':', () => {
        actions.setMode('COMMAND');
        actions.setSelectionAnchor(null); // Clear selection when entering command mode
    }, { description: 'Enter Command Mode' });
}

function registerBufferActions(keymaps: Keymaps, container: Container) {
    const bufferManager = container.get<BufferManager>('BufferManager')!;

    const cycle = (direction: 'next' | 'prev') => {
        const allBuffers = bufferManager.all();
        const activeId = state.activeBufferId();
        if (allBuffers.length < 2 || !activeId) return;

        const currentIndex = allBuffers.indexOf(activeId);
        let nextIndex;

        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % allBuffers.length;
        } else {
            nextIndex = (currentIndex - 1 + allBuffers.length) % allBuffers.length;
        }

        const nextBufferId = allBuffers[nextIndex];
        actions.setActiveBufferId(nextBufferId);
    };

    keymaps.set('NORMAL', ']b', () => cycle('next'), { description: 'Cycle to next buffer' });
    keymaps.set('NORMAL', '[b', () => cycle('prev'), { description: 'Cycle to previous buffer' });
}

function registerMotions(keymaps: Keymaps, container: Container) {
    const cursor = state.cursor();

    // --- Basic Movement ---
    const motionKeyModes: Modes[] = ['NORMAL', 'INSERT', 'VISUAL'];
    keymaps.set(motionKeyModes, '<Down>', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.moveDown(buffer, state.mode());
    }, { description: 'Move Down' });
    keymaps.set(motionKeyModes, '<Up>', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.moveUp(buffer, state.mode());
    }, { description: 'Move Up' });
    keymaps.set(motionKeyModes, '<Right>', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.moveRight(buffer, state.mode());
    }, { description: 'Move Right' });
    keymaps.set(motionKeyModes, '<Left>', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.moveLeft();
    }, { description: 'Move Left' });

    keymaps.set('NORMAL', 'j', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.moveDown(buffer, state.mode());
    }, { description: 'Move Down' });
    keymaps.set('NORMAL', 'k', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.moveUp(buffer, state.mode());
    }, { description: 'Move Up' });
    keymaps.set('NORMAL', 'l', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.moveRight(buffer, state.mode());
    }, { description: 'Move Right' });
    keymaps.set('NORMAL', 'h', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.moveLeft();
    }, { description: 'Move Left' });

    // --- Word Movement ---
    keymaps.set('NORMAL', 'w', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.forwardWord(buffer);
    }, { description: 'Forward Word' });
    keymaps.set('NORMAL', 'b', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.backwardWord(buffer);
    }, { description: 'Backward Word' });
    keymaps.set('NORMAL', 'e', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.endOfWord(buffer);
    }, { description: 'End of Word' });
    keymaps.set('NORMAL', 'W', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.forwardWORD(buffer);
    }, { description: 'Forward WORD' });
    keymaps.set('NORMAL', 'B', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.backwardWORD(buffer);
    }, { description: 'Backward WORD' });
    keymaps.set('NORMAL', 'E', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.endOfWORD(buffer);
    }, { description: 'End of WORD' });

    // --- Line Movement ---
    keymaps.set('NORMAL', 'gg', () => cursor.setRow(0), { description: 'Go to top of file' });
    keymaps.set('NORMAL', '0', () => cursor.moveToStartOfLine(), { description: 'Go to start of line' });
    keymaps.set('NORMAL', '$', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) cursor.moveToEndOfLine(buffer);
    }, { description: 'Go to end of line' });
    keymaps.set('NORMAL', 'f', () => actions.setPendingAction({ key: 'f' }), { description: 'Find character' });
    keymaps.set('NORMAL', 'F', () => actions.setPendingAction({ key: 'F' }), { description: 'Find character backward' });
}

function registerClipboardActions(keymaps: Keymaps, container: Container) {
    // --- Yank / Paste ---
    keymaps.set('VISUAL', 'y', () => {
        const selection = state.selection();
        const buffer = getActiveBuffer(container);
        if (selection && buffer) {
            const selectedText = buffer.getTextFromSelection(selection);
            navigator.clipboard.writeText(selectedText).then(() => {
                console.log('Text yanked to clipboard!');
            }).catch(err => {
                console.error('Failed to yank text: ', err);
            });
        }
        actions.setMode('NORMAL');
        actions.setSelectionAnchor(null);
    }, { description: 'Yank (copy) selection' });

    keymaps.set('NORMAL', 'p', () => {
        navigator.clipboard.readText().then(text => {
            if (!text) return;
            const buffer = getActiveBuffer(container);
            const cursor = state.cursor();
            if (!buffer) return;
            if (text.includes('\n')) {
                const linesToPaste = text.endsWith('\n') ? text.slice(0, -1).split('\n') : text.split('\n');
                buffer.insertLines(cursor.row(), linesToPaste);
                cursor.setRow(cursor.row() + 1);
                cursor.setCol(0);
            } else {
                buffer.insertText(cursor.row(), cursor.col(), text);
                cursor.setCol(cursor.col() + text.length);
            }
        }).catch(err => {
            console.error('Failed to read clipboard contents: ', err);
        });
    }, { description: 'Paste from clipboard' });

    keymaps.set('VISUAL', 'p', () => {
        const selection = state.selection();
        const buffer = getActiveBuffer(container);
        if (!selection || !buffer) return;
        const pastePos = buffer.deleteSelection(selection);
        actions.setCursorPosition(pastePos);
        actions.setMode('NORMAL');
        actions.setSelectionAnchor(null);
        navigator.clipboard.readText().then(text => {
            if (!text) return;
            buffer.pasteTextAt(pastePos.row, pastePos.col, text);
            actions.setCursorPosition(pastePos);
        }).catch(err => {
            console.error('Failed to read clipboard contents: ', err);
        });
    }, { description: 'Paste over selection' });
}

function registerOperatorActions(keymaps: Keymaps, container: Container) {
    const cursor = state.cursor();

    // --- Insert Mode Operators ---
    keymaps.set('INSERT', '<Enter>', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) {
            buffer.splitLine(cursor.row(), cursor.col());
            cursor.setRow(cursor.row() + 1);
            cursor.setCol(0);
        }
    }, { description: 'Insert Newline' });
    keymaps.set('INSERT', '<BS>', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) {
            if (cursor.col() > 0) {
                buffer.deleteChar(cursor.row(), cursor.col());
                cursor.setCol(cursor.col() - 1);
            } else if (cursor.row() > 0) {
                const newCol = buffer.mergeWithPreviousLine(cursor.row());
                cursor.setRow(cursor.row() - 1);
                if (newCol !== undefined) cursor.setCol(newCol);
            }
        }
    }, { description: 'Delete Character Before Cursor' });
    keymaps.set('INSERT', '<Tab>', () => {
        const buffer = getActiveBuffer(container);
        if (buffer) {
            const tabSize = 4; // Hardcoded for now, could be configurable
            buffer.insertText(cursor.row(), cursor.col(), ' '.repeat(tabSize));
            cursor.setCol(cursor.col() + tabSize);
        }
    }, { description: 'Insert Tab (4 spaces)' });

    // --- Visual Mode Operators ---
    keymaps.set('VISUAL', 'd', () => {
        const selection = state.selection();
        const buffer = getActiveBuffer(container);
        if (!selection || !buffer) return;
        const finalCursorPos = buffer.deleteSelection(selection);
        actions.setMode('NORMAL');
        actions.setSelectionAnchor(null);
        actions.setCursorPosition(finalCursorPos);
    }, { description: 'Delete selection' });
}

function registerEventHandlers(container: Container) {
    const eventBus = container.get<EventBus>('EventBus')!;
    const cursor = state.cursor();

    eventBus.on(Events.ACTION_INSERT_CHAR, (char: string) => {
        const buffer = getActiveBuffer(container);
        if (buffer) {
            buffer.insertChar(cursor.row(), cursor.col(), char);
            cursor.setCol(cursor.col() + 1);
        }
    });
}

export function registerKeymaps(container: Container) {
    const keymaps = container.get<Keymaps>('Keymaps')!;

    registerModeSwitches(keymaps, container);
    registerBufferActions(keymaps, container);
    registerMotions(keymaps, container);
    registerClipboardActions(keymaps, container);
    registerOperatorActions(keymaps, container);
    registerEventHandlers(container);
}