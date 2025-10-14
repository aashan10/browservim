# Plugin System

The browservim editor features a powerful plugin architecture that allows developers to extend functionality without modifying core editor code. This system provides a secure, curated API for plugin development and supports automatic plugin discovery and installation.

## Overview

The plugin system consists of three main components:

1. **Plugin Manager** - Automatically discovers and installs plugins
2. **Plugin API** - Secure interface for editor interaction
3. **Plugin Interface** - Contract that all plugins must implement

## Quick Start

### Creating a Plugin

Create a new TypeScript file in the `src/plugins/` directory:

```typescript
// src/plugins/my-plugin.ts
import type { Plugin } from '@lib/plugins/types';
import type { PluginAPI } from '@lib/plugins/api';

const MyPlugin: Plugin = {
    name: 'My Plugin',
    version: '1.0.0',

    install(api: PluginAPI) {
        // Add a keymap
        api.registerKeymap('NORMAL', ' mp', () => {
            console.log('My plugin activated!');
        }, { description: 'My plugin action' });

        // Add status bar component
        api.addStatusBarComponent(() => '[MY PLUGIN]', 'right');
    }
};

export default MyPlugin;
```

That's it! The plugin will be automatically discovered and installed when the editor starts.

## Plugin API Reference

The `PluginAPI` class provides five main methods for extending the editor:

### `registerKeymap(mode, lhs, rhs, opts?)`

Registers a new keybinding for the specified mode(s).

**Parameters:**
- `mode`: `Modes | Modes[]` - The mode(s) where the keymap is active
- `lhs`: `string` - The key sequence (e.g., `' ff'`, `'<Space>p'`, `'<C-j>'`)
- `rhs`: `KeymapAction` - Function to execute when keys are pressed
- `opts?`: `KeymapOptions` - Optional description for the keymap

**Example:**
```typescript
// Single mode
api.registerKeymap('NORMAL', 'gh', () => {
    console.log('Go to start of line');
});

// Multiple modes
api.registerKeymap(['NORMAL', 'VISUAL'], '<Space>y', () => {
    // Copy to system clipboard
});

// With description
api.registerKeymap('NORMAL', '<Space>ff', openFilePicker, {
    description: 'Open file picker'
});
```

### `addStatusBarComponent(component, alignment)`

Adds a reactive component to the status bar.

**Parameters:**
- `component`: `StatusBarComponent` - Function that returns display string
- `alignment`: `'left' | 'right'` - Where to position the component

**Example:**
```typescript
// Simple text
api.addStatusBarComponent(() => '[PLUGIN ACTIVE]', 'right');

// Reactive component
const [counter, setCounter] = createSignal(0);
api.addStatusBarComponent(() => `Count: ${counter()}`, 'left');
```

### `addPostDrawHook(callback)`

Registers a function to be called after each render frame, allowing custom canvas drawing.

**Parameters:**
- `callback`: `(ctx: CanvasRenderingContext2D) => void` - Render function

**Example:**
```typescript
api.addPostDrawHook((ctx) => {
    // Draw a custom overlay
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(10, 10, 100, 50);
    
    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px monospace';
    ctx.fillText('Plugin UI', 20, 30);
});
```

### `on(event, listener)`

Subscribes to global editor events.

**Parameters:**
- `event`: `string` - Event name to listen for
- `listener`: `(...args: any[]) => void` - Callback function

**Example:**
```typescript
api.on('action_set_mode', (newMode) => {
    console.log(`Mode changed to: ${newMode}`);
});

api.on('buffer_changed', (bufferId, content) => {
    // React to buffer modifications
});
```

### `getState()`

Provides read-only access to the editor's global reactive state.

**Returns:** Read-only state object with reactive getters

**Example:**
```typescript
const state = api.getState();

// Access current mode
const currentMode = state.mode();

// Get cursor position
const cursor = state.cursor();
const row = cursor.row();
const col = cursor.col();

// Get active buffer ID
const bufferId = state.activeBufferId();
```

## Plugin Interface

All plugins must implement the `Plugin` interface:

```typescript
interface Plugin {
    name: string;        // Unique plugin name
    version: string;     // Semantic version
    install(api: PluginAPI): void;  // Installation function
}
```

## Advanced Examples

### Modal Dialog Plugin

```typescript
import { createSignal, createEffect } from '@lib/reactivity';

const ModalPlugin: Plugin = {
    name: 'Modal Dialog',
    version: '1.0.0',

    install(api: PluginAPI) {
        const [isOpen, setIsOpen] = createSignal(false);
        const [message, setMessage] = createSignal('');

        // Open modal command
        api.registerKeymap('NORMAL', ' m', () => {
            setMessage('Hello from modal!');
            setIsOpen(true);
        });

        // Close modal on escape
        api.registerKeymap('NORMAL', '<Esc>', () => {
            if (isOpen()) {
                setIsOpen(false);
            }
        });

        // Render modal
        api.addPostDrawHook((ctx) => {
            if (!isOpen()) return;

            const width = 400;
            const height = 200;
            const x = (window.innerWidth - width) / 2;
            const y = (window.innerHeight - height) / 2;

            // Background overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            // Modal box
            ctx.fillStyle = '#2D2D2D';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = '#4A4A4A';
            ctx.strokeRect(x, y, width, height);

            // Message
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(message(), x + width/2, y + height/2);
        });
    }
};
```

### File Explorer Plugin

```typescript
const ExplorerPlugin: Plugin = {
    name: 'File Explorer',
    version: '1.0.0',

    install(api: PluginAPI) {
        const [files, setFiles] = createSignal<string[]>([]);
        const [selectedIndex, setSelectedIndex] = createSignal(0);

        // Toggle explorer
        api.registerKeymap('NORMAL', ' e', () => {
            // In a real implementation, you'd fetch file list
            setFiles(['file1.txt', 'file2.ts', 'folder/']);
        });

        // Navigation
        api.registerKeymap('NORMAL', '<C-n>', () => {
            setSelectedIndex((selectedIndex() + 1) % files().length);
        });

        api.registerKeymap('NORMAL', '<C-p>', () => {
            const fileList = files();
            setSelectedIndex((selectedIndex() - 1 + fileList.length) % fileList.length);
        });

        // Render file list
        api.addPostDrawHook((ctx) => {
            const fileList = files();
            if (fileList.length === 0) return;

            ctx.fillStyle = '#252526';
            ctx.fillRect(0, 50, 200, window.innerHeight - 50);

            fileList.forEach((file, index) => {
                const y = 70 + (index * 20);
                const isSelected = index === selectedIndex();

                if (isSelected) {
                    ctx.fillStyle = '#404040';
                    ctx.fillRect(0, y - 2, 200, 20);
                }

                ctx.fillStyle = isSelected ? '#FFFFFF' : '#CCCCCC';
                ctx.font = '14px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(file, 10, y + 12);
            });
        });
    }
};
```

## Built-in Plugins

The editor comes with several built-in plugins:

### Telescope Plugin

A powerful fuzzy finder for quick navigation and file searching.

**Keymaps:**
- `<Space>ff` - Open buffer picker
- `<Space>p` - Open buffer picker with metadata

**Usage:**
1. Press `<Space>ff` to open the buffer picker
2. Type to filter results with fuzzy matching
3. Use arrow keys, `j`/`k`, or `Ctrl+j`/`Ctrl+k` to navigate
4. Press `Enter` to select, `Esc` to close

**Features:**
- Real-time fuzzy searching with intelligent scoring
- Keyboard navigation in both INSERT and NORMAL modes
- Modal interface with results preview
- Temporary keymaps that don't interfere with normal editing

### Demo Plugin

A simple example plugin that demonstrates all API features.

**Keymaps:**
- `<Space>e` - Toggle demo overlay

**Features:**
- Status bar component
- Canvas overlay rendering
- Event listening for mode changes
- Reactive state management

## Plugin Discovery

Plugins are automatically discovered using Vite's `import.meta.glob` feature. The plugin manager:

1. Scans the `src/plugins/` directory for `.ts` files
2. Dynamically imports each plugin module
3. Validates the plugin interface
4. Calls the `install` method with the Plugin API

## Security

The Plugin API provides a curated, secure interface that:

- Prevents direct access to internal editor state
- Provides read-only access to reactive state
- Sandboxes plugin functionality to safe operations
- Validates all plugin interactions

## Best Practices

### Naming Conventions
- Use descriptive plugin names
- Follow semantic versioning
- Prefix keymaps with `<Space>` for plugin commands

### Performance
- Use reactive signals for efficient UI updates
- Minimize work in render hooks
- Clean up event listeners if needed

### User Experience
- Provide descriptive keymap descriptions
- Use consistent visual styling
- Handle edge cases gracefully

### Code Organization
- Keep plugin files focused and small
- Use TypeScript for type safety
- Follow the existing code style

## Debugging

- All plugins have access to `console.log` for debugging
- The global `window.$container` provides access to internal services (debugging only)
- Use the browser's developer tools to inspect plugin behavior

## Future Enhancements

The plugin system is designed for extensibility and may support additional features in the future:

- Plugin configuration system
- Plugin marketplace/registry
- Hot reloading during development
- Inter-plugin communication
- Plugin dependency management