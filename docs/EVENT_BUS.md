# Event Bus

The `EventBus` is a simple publish-subscribe system used for decoupled communication between different parts of the application.

## Purpose

While the reactive state system is the primary way to communicate state changes, the Event Bus is useful for two main scenarios:

1.  **Broadcasting Browser Events**: It captures global browser events (like `keydown`, `resize`, `paste`) and re-emits them on the bus. This allows any service to listen for these events without needing direct access to the `window` object.

2.  **High-Level Action Events**: It can be used to signal that a high-level action has occurred, which might not be directly tied to a state change. For example, `ACTION_INSERT_CHAR` is emitted by the `InputManager` in `INSERT` mode. The event handler in `src/keymaps.ts` listens for this and performs the buffer modification.

## Public API

-   `on(event: string, listener: (...args: any[]) => void)`: Subscribes to an event.
-   `off(event: string, listener: (...args: any[]) => void)`: Unsubscribes from an event.
-   `emit(event: string, ...args: any[])`: Publishes an event to all its listeners.

## Pre-defined Events

The `Events` enum in `lib/event-bus/index.ts` defines a list of known event names, which helps avoid typos and documents the available events.

```typescript
export enum Events {
    // Keyboard Events
    KEYDOWN = 'keydown',

    // Buffer Events
    BUFFER_ADD = 'buffer_add',

    // High-level Action Events
    ACTION_SET_MODE = 'action_set_mode',
    ACTION_INSERT_CHAR = 'action_insert_char',
}
```
