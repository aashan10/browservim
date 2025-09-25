# Buffer

The `Buffer` class is responsible for holding and manipulating the text content of a single buffer (which usually corresponds to a file).

## Core Concepts

-   **Line-Based**: The text is stored internally as an array of strings, where each string is a line.
-   **Reactive**: The array of lines is a reactive `signal`. When the lines are changed (e.g., by inserting a character), any part of the application that depends on `buffer.getLines()` will be automatically updated.

## Public API

-   `constructor(name: string, content: string)`: Creates a new buffer.
-   `getLines()`: A reactive getter that returns the current array of lines.
-   `insertChar(row: number, col: number, char: string)`: Inserts a single character at a specific position.
-   `deleteChar(row: number, col: number)`: Deletes a single character at a specific position.
-   `splitLine(row: number, col: number)`: Splits a line into two at the given position.
-   `mergeWithPreviousLine(row: number)`: Merges a line with the one above it.
-   `deleteSelection(selection: Selection)`: Deletes the text within the given selection range.
-   `getTextFromSelection(selection: Selection)`: Returns the text within a selection.
-   `pasteTextAt(row: number, col: number, text: string)`: Pastes a block of text at a given position, handling multi-line pastes correctly.
