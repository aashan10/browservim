# Architecture Overview

This document provides a high-level overview of the `nvim.ts` architecture. The application is designed to be a modular and reactive Vim-like editor that runs in the browser.

## Core Principles

1.  **Modularity**: Each core piece of functionality (state, rendering, input, text manipulation) is isolated in its own module.
2.  **Reactivity**: The UI automatically updates in response to state changes. This is powered by a custom, lightweight reactivity system.
3.  **Dependency Injection**: A simple container is used to manage dependencies between modules, promoting loose coupling.

## Component Flow

The application follows a unidirectional data flow, inspired by modern frontend frameworks.

```
+----------------+      +--------------+      +-----------------+
|                |      |              |      |                 |
|  InputManager  +----->|    Keymaps   +----->|     Actions     |
| (Captures Keys)|      | (Finds Match)|      | (Update State)  |
|                |      |              |      |                 |
+-------+--------+      +--------------+      +--------+--------+
        ^                                              |
        |                                              |
        |                                              v
+-------+--------+      +--------------+      +--------+--------+
|                |      |              |      |                 |
|    Renderer    +<-----+    State     <------+   (Side Effects)|
| (Draws to     )|      |  (Reactive)  |      | (e.g. Buffer Ops|
|   Canvas)      |      |              |      |                 |
+----------------+      +--------------+      +-----------------+
```

1.  **`InputManager`**: Captures all keyboard events. It builds a queue of recent key presses to handle multi-key sequences (e.g., `gg`).
2.  **`Keymaps`**: The `InputManager` checks the key sequence against the keymaps defined for the current `mode`.
3.  **Action**: If a matching keymap is found, its associated action is executed.
4.  **State Update**: Actions are functions that modify the application's state (e.g., `actions.setMode('INSERT')`). These actions are the only things that should mutate the state.
5.  **Reactivity**: The core `State` is reactive. Any part of the application that depends on a piece of state (like the `Renderer`) will be automatically re-executed when that state changes.
6.  **`Renderer`**: The `Renderer` uses a `createEffect` block that depends on the `cursor`, `activeBuffer`, and `selection`. When any of these change, the effect re-runs, drawing the updated scene to the canvas.

## The Container

All major services are instantiated and wired together in `src/main.ts` using a simple dependency injection `Container`. This avoids hardcoded dependencies between modules and makes it easier to manage the application's lifecycle.

-   `EventBus`: Handles low-level event communication.
-   `Keymaps`: Stores all key-to-action mappings.
-   `BufferManager`: Manages all open text buffers.
-   `Renderer`: Manages the canvas and drawing.
-   `InputManager`: Manages user input.
