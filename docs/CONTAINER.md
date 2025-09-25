# Container

The `Container` class is a simple Inversion of Control (IoC) container, also known as a Dependency Injection (DI) container. Its purpose is to manage the lifecycle and dependencies of the application's services.

## Purpose

In a modular application, different components need to talk to each other. For example, the `InputManager` needs access to the `Keymaps` service, and the `Renderer` needs access to the `BufferManager`.

Instead of having each component create its own dependencies (which would lead to tight coupling and multiple instances), we use a central container.

1.  **Instantiation**: In `src/main.ts`, we create a single instance of each major service.
2.  **Registration**: We register each service instance with the container under a unique string key.
3.  **Injection**: When a service needs a dependency, it requests it from the container using its key.

This pattern makes the application easier to manage, test, and refactor, as dependencies are explicit and managed in one place.

## Public API

-   `set(key: string, value: any)`: Registers an instance of a service with the container.

    ```typescript
    // From src/main.ts
    const container = new Container();
    const eventBus = new EventBus();

    container.set('EventBus', eventBus);
    ```

-   `get<T>(key: string): T | undefined`: Retrieves a service instance from the container.

    ```typescript
    // From a component's constructor
    const eventBus = this.container.get<EventBus>('EventBus')!;
    ```

-   `has(key: string): boolean`: Checks if a service is registered.
-   `bind<T>(key: string, constructor: new (...args: any[]) => T)`: A utility method to instantiate and register a service in one step, ensuring it's a singleton.
