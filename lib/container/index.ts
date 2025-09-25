export class Container {
    private items: Map<string, any>;

    constructor() {
        this.items = new Map<string, any>();
    }

    set(key: string, value: any) {
        this.items.set(key, value);
    }

    get<T>(key: string): T | undefined {
        return this.items.get(key);
    }

    has(key: string): boolean {
        return this.items.has(key);
    }

    bind<T>(key: string, constructor: new (...args: any[]) => T) {
        if (!this.items.has(key)) {
            this.items.set(key, new constructor());
        }
    }
}
