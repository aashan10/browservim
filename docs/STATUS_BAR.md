# Status Bar Manager

The `StatusBarManager` class provides a reactive and extensible way to control the content of the editor's status bar.

## Purpose

Instead of having the `Renderer` hard-code the contents of the status bar, the `StatusBarManager` acts as a centralized service where different parts of the application can register, update, or remove UI components.

This keeps the rendering logic decoupled from the content, making it easy to add new information to the status bar without modifying the `Renderer` itself.

## Core Concepts

-   **Reactive Components**: A status bar "component" is simply a reactive function that returns a string (`() => string`). Because the function is reactive, if it depends on any signals (like `state.mode`), it will automatically re-evaluate when that signal changes.

-   **Left and Right Alignment**: The manager maintains separate lists of components for the left and right sides of the status bar.

-   **Automatic Updates**: The manager uses a `createMemo` to watch all registered components. It automatically joins their outputs into single strings for the left and right sides. The `Renderer` subscribes to these final memoized signals and redraws the status bar whenever they change.

## Public API

-   `addLeft(component: () => string)`: Registers a new component to be displayed on the left side of the status bar.

-   `addRight(component: () => string)`: Registers a new component to be displayed on the right side of the status bar.

## Example Usage

Here is how the default status bar components are registered in `src/main.ts`:

```typescript
// In src/main.ts

const statusBarManager = container.get<StatusBarManager>('StatusBarManager')!;
const bufferManager = container.get<BufferManager>('BufferManager')!;

// Add the mode component (reactive)
statusBarManager.addLeft(() => `-- ${state.mode()} --`);

// Add the buffer name component (reactive)
statusBarManager.addLeft(() => {
    const bufferId = state.activeBufferId();
    if (!bufferId) return '';
    const buffer = bufferManager.get(bufferId);
    return buffer ? buffer.name : '';
});

// Add the cursor position component (reactive)
statusBarManager.addRight(() => {
    const cursor = state.cursor();
    return `${cursor.row() + 1}:${cursor.col() + 1}`;
});
```

If another part of the application wanted to add, for example, the total line count to the right side of the status bar, it would just need to get the `StatusBarManager` from the container and add a new component.