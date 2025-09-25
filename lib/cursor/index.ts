import { createSignal } from '@lib/reactivity';
import type { Buffer } from '@lib/buffer';

enum CharType {
    Whitespace,
    Word, // letters, digits, underscore
    Punctuation,
}

function getCharType(char: string | undefined): CharType {
    if (!char || /\s/.test(char)) return CharType.Whitespace;
    if (/\w/.test(char)) return CharType.Word; // In JS, \w is [A-Za-z0-9_]
    return CharType.Punctuation;
}

export class Cursor {
    public readonly row;
    public readonly setRow;
    public readonly col;
    public readonly setCol;

    constructor(initialRow = 0, initialCol = 0) {
        const [row, setRow] = createSignal(initialRow);
        const [col, setCol] = createSignal(initialCol);
        this.row = row;
        this.setRow = setRow;
        this.col = col;
        this.setCol = setCol;
    }

    // --- BOUNDARY-CHECKING MOVEMENT ---
    public moveUp(buffer: Buffer, mode: Modes) {
        this.setRow(Math.max(0, this.row() - 1));
        this.clampCol(buffer, mode);
    }

    public moveDown(buffer: Buffer, mode: Modes) {
        const lineCount = buffer.getLines().length;
        this.setRow(Math.min(lineCount > 0 ? lineCount - 1 : 0, this.row() + 1));
        this.clampCol(buffer, mode);
    }

    public moveLeft() {
        this.setCol(Math.max(0, this.col() - 1));
    }

    public moveToStartOfLine() {
        this.setCol(0);
    }

    public moveToEndOfLine(buffer: Buffer) {
        const line = buffer.getLines()[this.row()];
        if (!line) return;
        const maxCol = line.length > 0 ? line.length - 1 : 0;
        this.setCol(maxCol);
    }

    public findChar(buffer: Buffer, char: string) {
        const line = buffer.getLines()[this.row()];
        if (!line) return;

        for (let i = this.col() + 1; i < line.length; i++) {
            if (line[i] === char) {
                this.setCol(i);
                return; // Found
            }
        }
    }

    public findCharBackward(buffer: Buffer, char: string) {
        const line = buffer.getLines()[this.row()];
        if (!line) return;

        for (let i = this.col() - 1; i >= 0; i--) {
            if (line[i] === char) {
                this.setCol(i);
                return; // Found
            }
        }
    }

    public moveRight(buffer: Buffer, mode: Modes) {
        const line = buffer.getLines()[this.row()];
        if (!line) {
            this.setCol(0);
            return;
        }
        // In INSERT mode, cursor can go one past the last character.
        const maxCol = mode === 'INSERT' ? line.length : (line.length > 0 ? line.length - 1 : 0);
        this.setCol(Math.min(maxCol, this.col() + 1));
    }

    // --- WORD MOVEMENT ---

    public forwardWord(buffer: Buffer) {
        let [row, col] = [this.row(), this.col()];
        const lines = buffer.getLines();
        if (row >= lines.length) return;

        const initialCharType = getCharType(lines[row][col]);

        // 1. If on a word/punctuation, move to the end of it
        if (initialCharType !== CharType.Whitespace) {
            while (col < lines[row].length && getCharType(lines[row][col]) === initialCharType) {
                col++;
            }
        }

        // 2. If we are not at the end of the buffer, skip whitespace to find the next word
        if (col >= lines[row].length && row < lines.length - 1) {
            col = 0;
            row++;
        }
        while (row < lines.length) {
            if (getCharType(lines[row][col]) === CharType.Whitespace) {
                col++;
                if (col >= lines[row].length && row < lines.length - 1) {
                    col = 0;
                    row++;
                }
            } else {
                break;
            }
        }

        this.setRow(row);
        this.setCol(col);
    }

    public backwardWord(buffer: Buffer) {
        let [row, col] = [this.row(), this.col()];
        const lines = buffer.getLines();

        // 1. Go back at least one char
        col--;

        // 2. Find the end of the previous word (a non-whitespace char)
        while (true) {
            if (row < 0) { // Reached beginning of file
                this.setRow(0); this.setCol(0); return;
            }
            if (col < 0) { // Go to previous line
                row--;
                if (row < 0) continue;
                col = lines[row].length - 1;
                continue;
            }
            if (getCharType(lines[row][col]) !== CharType.Whitespace) {
                break; // Found the end of a word
            }
            col--;
        }

        // 3. Go to the beginning of that word
        const type = getCharType(lines[row][col]);
        while (col > 0 && getCharType(lines[row][col - 1]) === type) {
            col--;
        }

        this.setRow(row);
        this.setCol(col);
    }

    public endOfWord(buffer: Buffer) {
        let [row, col] = [this.row(), this.col()];
        const lines = buffer.getLines();

        // 1. Go forward at least one char
        col++;

        // 2. Find the beginning of the next word
        while (true) {
            if (row >= lines.length) { // Reached end of file
                row = lines.length - 1;
                col = lines[row]?.length > 0 ? lines[row].length - 1 : 0;
                this.setRow(row); this.setCol(col); return;
            }
            if (col >= lines[row].length) { // Go to next line
                row++;
                col = 0;
                continue;
            }
            if (getCharType(lines[row][col]) !== CharType.Whitespace) {
                break; // Found the start of a word
            }
            col++;
        }

        // 3. Go to the end of that word
        const type = getCharType(lines[row][col]);
        while (col + 1 < lines[row].length && getCharType(lines[row][col + 1]) === type) {
            col++;
        }

        this.setRow(row);
        this.setCol(col);
    }

    // --- W.O.R.D. MOVEMENT (whitespace separated) ---
    public forwardWORD(buffer: Buffer) {
        let [row, col] = [this.row(), this.col()];
        const lines = buffer.getLines();
        if (row >= lines.length) return;

        // 1. If on a WORD, move past it
        if (getCharType(lines[row][col]) !== CharType.Whitespace) {
            while (col < lines[row].length && getCharType(lines[row][col]) !== CharType.Whitespace) {
                col++;
            }
        }

        // 2. Skip whitespace to find the next WORD
        while (row < lines.length) {
            if (getCharType(lines[row][col]) === CharType.Whitespace) {
                col++;
                if (col >= lines[row].length && row < lines.length - 1) {
                    col = 0;
                    row++;
                }
            } else {
                break;
            }
        }

        this.setRow(row);
        this.setCol(col);
    }

    public backwardWORD(buffer: Buffer) {
        let [row, col] = [this.row(), this.col()];
        const lines = buffer.getLines();
        if (row < 0) return;

        // Move back one char to start
        if (col > 0) {
            col--;
        } else if (row > 0) {
            row--;
            col = lines[row].length -1;
        }

        // Find previous non-whitespace
        while (row >= 0) {
            if (getCharType(lines[row][col]) === CharType.Whitespace) {
                col--;
                if (col < 0 && row > 0) {
                    row--;
                    col = lines[row].length - 1;
                }
            } else {
                break;
            }
        }

        // Move to beginning of WORD
        while (col > 0 && getCharType(lines[row][col - 1]) !== CharType.Whitespace) {
            col--;
        }

        this.setRow(row);
        this.setCol(col);
    }

    public endOfWORD(buffer: Buffer) {
        let [row, col] = [this.row(), this.col()];
        const lines = buffer.getLines();
        if (row >= lines.length) return;

        // Move forward one char to start
        if (col < lines[row].length - 1) {
            col++;
        }

        // Skip whitespace
        while (row < lines.length) {
            if (getCharType(lines[row][col]) === CharType.Whitespace) {
                col++;
                if (col >= lines[row].length && row < lines.length - 1) {
                    col = 0;
                    row++;
                }
            } else {
                break;
            }
        }

        // Move to end of WORD
        while (col < lines[row].length - 1 && getCharType(lines[row][col + 1]) !== CharType.Whitespace) {
            col++;
        }

        this.setRow(row);
        this.setCol(col);
    }

    private clampCol(buffer: Buffer, mode: Modes) {
        const line = buffer.getLines()[this.row()];
        if (!line) {
            this.setCol(0);
            return;
        }
        const maxCol = mode === 'INSERT' ? line.length : (line.length > 0 ? line.length - 1 : 0);
        this.setCol(Math.min(maxCol, this.col()));
    }
}
