# Reactivity

The custom reactivity library in `lib/reactivity/index.ts` is the foundation of the application's architecture. It provides a simple, yet powerful way to create reactive state that automatically updates the UI and other parts of the system when it changes. It is inspired by libraries like Solid.js.

## Core Concepts

At its core, the system is built on the observer pattern. When an `effect` runs, it keeps track of every `signal` it reads. When one of those signals is updated, the effect is re-run.

-   **`context`**: A global stack that holds the currently running `effect`. When a signal's getter is called, it checks this context. If there's a running effect, the signal subscribes that effect to its own list of dependencies.

-   **`cleanup`**: Before an effect re-runs, it first cleans up its old subscriptions. This ensures that dependencies are not stale (e.g., if an `if` statement in an effect means a signal is no longer read).

## Public API

### `createSignal<T>(value: T): [() => T, (value: T) => void]`

Creates a new reactive state container.

-   **Returns**: A tuple containing a `getter` and a `setter`.
-   **Getter**: When called inside an effect, it registers the effect as a dependency. It always returns the current value.
-   **Setter**: Updates the signal's value and notifies all subscribed effects to re-run.

```typescript
const [count, setCount] = createSignal(0);

// read the value
console.log(count()); // 0

// update the value
setCount(1);
```

### `createEffect<T>(callback: () => T)`

Creates a new computation that automatically re-runs when its dependencies change.

-   `callback`: The function to execute. The system will automatically track any signals read within this function.

```typescript
createEffect(() => {
  console.log(`The count is: ${count()}`)
});
//> The count is: 1

setCount(2);
//> The count is: 2
```

### `createMemo<T>(fn: () => T)`

Creates a derived, read-only signal. Memos are both observers and observables.

-   `fn`: The function to compute the value. It will re-run whenever its own dependencies change.
-   **Returns**: A getter for the computed value.

Use memos to efficiently compute values that are derived from other signals, without re-computing them on every read.

```typescript
const doubleCount = createMemo(() => count() * 2);

createEffect(() => {
    console.log(`Double count is ${doubleCount()}`)
});
//> Double count is 4

setCount(3);
//> Double count is 6
```
