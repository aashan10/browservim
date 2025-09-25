# Cursor

The `Cursor` class manages the state and movement logic for the cursor within a buffer.

## Core Concepts

-   **Reactive Position**: The cursor's `row` and `col` are reactive signals. This means the renderer can track the cursor's position and redraw it automatically whenever it moves.
-   **Mode-Aware Movement**: Cursor movement methods are aware of the current editor mode (`NORMAL` vs. `INSERT`). For example, in `INSERT` mode, the cursor can move one position past the last character on a line, which is not allowed in `NORMAL` mode.
-   **Boundary-Checking**: All movement methods are responsible for ensuring the cursor stays within the valid boundaries of the buffer.
-   **Vim Motions**: The class implements complex Vim motions like word-based movement (`w`, `b`, `e`) and WORD-based movement (`W`, `B`, `E`).

## Word-Movement Logic

The cursor distinguishes between three `CharType`s to calculate word boundaries:

1.  `Whitespace`: Spaces, tabs, newlines.
2.  `Word`: Letters, numbers, and underscores (`\w` in regex).
3.  `Punctuation`: Any other character.

A `word` is a sequence of `Word` characters. A `WORD` is a sequence of any non-whitespace characters.

## Public API

-   `row()`: Reactive getter for the cursor's row.
-   `col()`: Reactive getter for the cursor's column.
-   `setRow(row: number)` / `setCol(col: number)`: Setters for the cursor's position.
-   `moveUp(buffer, mode)` / `moveDown(buffer, mode)` / `moveLeft()` / `moveRight(buffer, mode)`: Basic directional movement.
-   `forwardWord(buffer)` / `backwardWord(buffer)` / `endOfWord(buffer)`: Implements `w`, `b`, `e` motions.
-   `forwardWORD(buffer)` / `backwardWORD(buffer)` / `endOfWORD(buffer)`: Implements `W`, `B`, `E` motions.
-   `moveToStartOfLine()` / `moveToEndOfLine(buffer)`: Implements `0` and `$` motions.
-   `findChar(buffer, char)` / `findCharBackward(buffer, char)`: Implements `f` and `F` motions.
