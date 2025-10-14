import { createSignal } from '@lib/reactivity';
import type { Position, Selection } from '@lib/state';

export interface BufferConfig {
    readonly?: boolean;
    filetype?: string;
}

const defaultConfig: BufferConfig = {
    readonly: false,
    filetype: 'text',
};

export class Buffer {
    public readonly name: string;
    public readonly config: BufferConfig;
    public readonly getLines;
    private readonly setLines;

    constructor(name: string, content: string, config: BufferConfig = {}) {
        this.name = name;
        this.config = { ...defaultConfig, ...config };
        const [getLines, setLines] = createSignal(content.split('\n'));
        this.getLines = getLines;
        this.setLines = setLines;
    }

    public insertChar(row: number, col: number, char: string) {
        if (this.config.readonly) return;
        const lines = [...this.getLines()];
        if (row < 0 || row >= lines.length) return;
        const line = lines[row];
        // Correct: Insert char AT the cursor column
        lines[row] = line.slice(0, col) + char + line.slice(col);
        this.setLines(lines);
    }

    public splitLine(row: number, col: number) {
        if (this.config.readonly) return;
        const lines = [...this.getLines()];
        if (row < 0 || row >= lines.length) return;
        const line = lines[row];
        const before = line.slice(0, col);
        const after = line.slice(col);
        lines.splice(row, 1, before, after);
        this.setLines(lines);
    }

    public deleteChar(row: number, col: number) {
        if (this.config.readonly) return;
        const lines = [...this.getLines()];
        if (row < 0 || row >= lines.length || col <= 0) return;
        const line = lines[row];
        lines[row] = line.slice(0, col - 1) + line.slice(col);
        this.setLines(lines);
    }

    public mergeWithPreviousLine(row: number) {
        if (this.config.readonly) return;
        const lines = [...this.getLines()];
        if (row <= 0 || row >= lines.length) return;
        const prevLine = lines[row - 1];
        const currentLine = lines[row];
        const newCursorCol = prevLine.length;
        lines[row - 1] = prevLine + currentLine;
        lines.splice(row, 1);
        this.setLines(lines);
        return newCursorCol;
    }

    public deleteSelection(selection: Selection): Position {
        if (this.config.readonly) return selection.start; // Return a value to satisfy type
        const lines = [...this.getLines()];
        const { start, end } = selection;

        if (start.row === end.row) {
            const line = lines[start.row];
            lines[start.row] = line.slice(0, start.col) + line.slice(end.col + 1);
        } else {
            const startLine = lines[start.row];
            const endLine = lines[end.row];
            lines[start.row] = startLine.slice(0, start.col) + endLine.slice(end.col + 1);
            const deleteCount = end.row - start.row;
            lines.splice(start.row + 1, deleteCount);
        }

        this.setLines(lines);
        return start;
    }

    public pasteTextAt(row: number, col: number, text: string) {
        if (this.config.readonly) return;
        const lines = [...this.getLines()];
        const line = lines[row];
        
        const before = line.slice(0, col);
        const after = line.slice(col);

        const textToPaste = text.split('\n');
        const firstPastedLine = textToPaste.shift() || '';

        lines[row] = before + firstPastedLine;

        if (textToPaste.length > 0) {
            const lastPastedLine = textToPaste.pop() || '';
            lines.splice(row + 1, 0, ...textToPaste, lastPastedLine + after);
        } else {
            lines[row] += after;
        }

        this.setLines(lines);
    }

    public getTextFromSelection(selection: Selection): string {
        const lines = this.getLines();
        const { start, end } = selection;

        if (start.row === end.row) {
            return lines[start.row].slice(start.col, end.col + 1);
        } else {
            let text = '';
            text += lines[start.row].slice(start.col) + '\n';
            for (let i = start.row + 1; i < end.row; i++) {
                text += lines[i] + '\n';
            }
            text += lines[end.row].slice(0, end.col + 1);
            return text;
        }
    }

    public insertText(row: number, col: number, text: string) {
        if (this.config.readonly) return;
        const lines = [...this.getLines()];
        if (row < 0 || row >= lines.length) return;
        const line = lines[row];
        // Correct: Insert text AT the cursor column
        lines[row] = line.slice(0, col) + text + line.slice(col);
        this.setLines(lines);
    }

    public insertLines(row: number, newLines: string[]) {
        if (this.config.readonly) return;
        const lines = [...this.getLines()];
        if (row < 0 || row >= lines.length) return;
        lines.splice(row + 1, 0, ...newLines);
        this.setLines(lines);
    }
}
