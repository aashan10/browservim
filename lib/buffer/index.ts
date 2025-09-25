import { createSignal } from '@lib/reactivity';
import type { Selection } from '@lib/state';

export class Buffer {
    public readonly name: string;
    public readonly getLines;
    private readonly setLines;

    constructor(name: string, content: string) {
        this.name = name;
        const [getLines, setLines] = createSignal(content.split('\n'));
        this.getLines = getLines;
        this.setLines = setLines;
    }

    public insertChar(row: number, col: number, char: string) {
        const lines = [...this.getLines()];
        if (row < 0 || row >= lines.length) return;
        const line = lines[row];
        lines[row] = line.slice(0, col) + char + line.slice(col);
        this.setLines(lines);
    }

    public splitLine(row: number, col: number) {
        const lines = [...this.getLines()];
        if (row < 0 || row >= lines.length) return;
        const line = lines[row];
        const before = line.slice(0, col);
        const after = line.slice(col);
        lines.splice(row, 1, before, after);
        this.setLines(lines);
    }

    public deleteChar(row: number, col: number) {
        const lines = [...this.getLines()];
        // Can't delete if cursor is at the beginning of the line
        if (row < 0 || row >= lines.length || col <= 0) return;
        const line = lines[row];
        lines[row] = line.slice(0, col - 1) + line.slice(col);
        this.setLines(lines);
    }

    public mergeWithPreviousLine(row: number) {
        const lines = [...this.getLines()];
        if (row <= 0 || row >= lines.length) return;
        const prevLine = lines[row - 1];
        const currentLine = lines[row];
        const newCursorCol = prevLine.length;
        lines[row - 1] = prevLine + currentLine;
        lines.splice(row, 1);
        this.setLines(lines);
        return newCursorCol; // Return the new cursor column
    }

    public deleteSelection(selection: Selection): Position {
        const lines = [...this.getLines()];
        const { start, end } = selection;

        if (start.row === end.row) {
            // Single-line deletion
            const line = lines[start.row];
            lines[start.row] = line.slice(0, start.col) + line.slice(end.col + 1);
        } else {
            // Multi-line deletion
            const startLine = lines[start.row];
            const endLine = lines[end.row];
            // 1. Merge the start and end lines
            lines[start.row] = startLine.slice(0, start.col) + endLine.slice(end.col + 1);

            // 2. Delete the lines in between
            const deleteCount = end.row - start.row;
            lines.splice(start.row + 1, deleteCount);
        }

        this.setLines(lines);
        return start; // Return the start position for pasting
    }

    public pasteTextAt(row: number, col: number, text: string) {
        const lines = [...this.getLines()];
        const line = lines[row];
        
        const before = line.slice(0, col);
        const after = line.slice(col);

        const textToPaste = text.split('\n');
        const firstPastedLine = textToPaste.shift() || '';

        lines[row] = before + firstPastedLine;

        if (textToPaste.length > 0) {
            // If there are more lines in the pasted text, insert them and append the `after` part to the very last one.
            const lastPastedLine = textToPaste.pop() || '';
            lines.splice(row + 1, 0, ...textToPaste, lastPastedLine + after);
        } else {
            // If it was a single line paste, just re-attach the `after` part.
            lines[row] += after;
        }

        this.setLines(lines);
    }

    public getTextFromSelection(selection: Selection): string {
        const lines = this.getLines();
        const { start, end } = selection;

        if (start.row === end.row) {
            // Single-line selection
            return lines[start.row].slice(start.col, end.col + 1);
        } else {
            // Multi-line selection
            let text = '';
            // First line
            text += lines[start.row].slice(start.col) + '\n';
            // Middle lines
            for (let i = start.row + 1; i < end.row; i++) {
                text += lines[i] + '\n';
            }
            // Last line
            text += lines[end.row].slice(0, end.col + 1);
            return text;
        }
    }

    public insertText(row: number, col: number, text: string) {
        const lines = [...this.getLines()];
        if (row < 0 || row >= lines.length) return;
        const line = lines[row];
        // Insert text after the cursor column
        lines[row] = line.slice(0, col + 1) + text + line.slice(col + 1);
        this.setLines(lines);
    }

    public insertLines(row: number, newLines: string[]) {
        const lines = [...this.getLines()];
        if (row < 0 || row >= lines.length) return;
        // Insert new lines after the current line
        lines.splice(row + 1, 0, ...newLines);
        this.setLines(lines);
    }
}
