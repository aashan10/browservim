# TODO & Future Features

This is a list of potential features to implement to bring `nvim.ts` closer to the functionality of real Vim.

## High Priority

-   [ ] **Undo / Redo**: Implement an undo tree (`u` and `<C-r>`).
-   [ ] **Command Mode**: Implement the `:` command-line for commands like `:w`, `:q`, `:wq`, `:e`.
-   [ ] **Search**: Implement `/` and `?` for forward and backward search, including `n` and `N` to jump between matches.
-   [ ] **Counts for Motions/Operators**: Add support for counts, e.g., `3w` (move 3 words), `5j` (move 5 lines down), `d3w` (delete 3 words).
-   [ ] **`.` (Repeat) command**: Store the last change (operator + motion) and allow repeating it with `.`.

## Operators & Text Objects

-   [ ] **`c` (change) operator**: `cc` (change line), `cw` (change word), etc.
-   [ ] **`x` (delete character)** and `s` (substitute character) operators.
-   [ ] **Text Objects**: `iw` (inner word), `aw` (a word), `i"` (inner quotes), etc. This would allow for commands like `diw` (delete inner word).
-   [ ] **`r` (replace) operator**: `r{char}` to replace the character under the cursor.

## Motions

-   [ ] **`G`**: Go to the last line of the file.
-   [ ] **`H` / `M` / `L`**: Move cursor to High, Middle, or Low portion of the visible screen.
-   [ ] **`*` / `#`**: Search for the word currently under the cursor.
-   [ ] **`%`**: Jump to matching bracket `()`, `[]`, `{}`.
-   [ ] **`(` / `)`**: Move by sentence.
-   [ ] **`{` / `}`**: Move by paragraph.

## UI & UX

-   [ ] **Status Bar**: A bar at the bottom showing the current mode, file name, cursor position, etc.
-   [ ] **Line Numbers**: Display line numbers in a gutter.
-   [ ] **Buffer Tabs**: A tabline at the top to show and switch between open buffers.
-   [ ] **Scrolling**: Implement viewport scrolling for files larger than the screen.
-   [ ] **Theming**: Allow for customizable colors.

## Visual Modes

-   [ ] **`V` (Visual Line)**: Select whole lines at a time.
-   [ ] **`<C-v>` (Visual Block)**: Select rectangular blocks of text.

## File System

-   [ ] **Saving files**: Connect the `:w` command to actually save file content (e.g., via download or File System Access API).
-   [ ] **Opening files**: An `:e` command or file picker to load new files into buffers.
