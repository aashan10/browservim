# Renderer

The `Renderer` class is responsible for drawing the entire editor state onto an HTML `<canvas>` element.

## Core Concepts

-   **Reactive Rendering**: The primary drawing logic is wrapped in a `createEffect` call. This effect subscribes to all the reactive state it needs to perform its job.

    ```typescript
    createEffect(() => {
        const bufferId = state.activeBufferId();
        const cursor = state.cursor();
        const sel = state.selection();
        // ... register dependencies on cursor.row() and cursor.col()

        // ... get the buffer content

        this.drawScene(buffer, cursor, sel);
    });
    ```

    Whenever the mode, active buffer, buffer content, cursor position, or selection changes, this effect automatically re-runs, redrawing the scene with the new state.

-   **Canvas API**: It uses the standard 2D Canvas API for all drawing operations (`fillRect`, `fillText`).
-   **DPI Scaling**: The renderer handles high-DPI (Retina) displays by scaling the canvas based on `window.devicePixelRatio` to ensure text is sharp.
-   **Animation Loop**: A `requestAnimationFrame` loop is used to handle canvas resizing smoothly.

## Drawing Functions

The rendering process is broken down into several private methods:

-   `drawScene()`: The main entry point that orchestrates the drawing.
-   `clear()`: Clears the canvas with the background color.
-   `drawSelection()`: Draws the background for the selected text.
-   `drawBuffer()`: Draws the text content of the buffer.
-   `drawCursor()`: Draws the cursor block at its current position.
