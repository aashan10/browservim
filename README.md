# nvim.ts

A small, educational, browser-based text editor inspired by Neovim, built from scratch with TypeScript and a custom reactivity system.

## Purpose

This project is an educational exercise to explore the core concepts of a modern text editor and the architectural patterns behind a complex frontend application. It aims to deconstruct and implement fundamental features of Vim/Neovim, such as modal editing, a reactive UI, and a flexible keymapping system, all while being completely self-contained with zero runtime dependencies.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run the development server:
    ```bash
    npm run dev
    ```

## Documentation

The architecture is designed to be modular and extensible. Learn more about the internal components in the documentation below.

| File | Description |
|---|---|
| [**OVERVIEW.md**](./docs/OVERVIEW.md) | A high-level look at the application architecture and data flow. |
| [**REACTIVITY.md**](./docs/REACTIVITY.md) | An explanation of the custom reactivity system that powers the UI. |
| [**STATE.md**](./docs/STATE.md) | How global reactive state is managed. |
| [**RENDERER.md**](./docs/RENDERER.md) | How the editor is drawn onto the HTML canvas. |
| [**INPUT_MANAGER.md**](./docs/INPUT_MANAGER.md) | How keyboard input and Vim's command sequences are processed. |
| [**KEYMAPS.md**](./docs/KEYMAPS.md) | How to define and manage keybindings for different modes. |
| [**BUFFER.md**](./docs/BUFFER.md) | The data structure for holding and manipulating text. |
| [**CURSOR.md**](./docs/CURSOR.md) | The logic for cursor state and movement. |
| [**CONTAINER.md**](./docs/CONTAINER.md) | The dependency injection container used to wire services together. |
| [**EVENT_BUS.md**](./docs/EVENT_BUS.md) | The simple pub/sub system for decoupled communication. |
| | |
| [**EXTENDING.md**](./docs/EXTENDING.md) | **A guide on how to add new features and commands.** |
| [**TODO.md**](./docs/TODO.md) | **A list of planned features and ideas for the future.** |
