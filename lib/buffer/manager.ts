import { Events, type EventBus } from "@lib/event-bus";
import type { Buffer } from "@lib/buffer";

export class BufferManager {

    private buffers: Map<string, Buffer> = new Map();
    private pinnedBuffers: Set<string> = new Set();

    constructor(
        private eventBus: EventBus
    ) { }

    add(id: string, buffer: Buffer) {
        this.buffers.set(id, buffer);
        this.eventBus.emit(Events.BUFFER_ADD, id, buffer);
    }

    remove(id: string) {
        this.buffers.delete(id);
        this.pinnedBuffers.delete(id);
        this.eventBus.emit(Events.BUFFER_REMOVE, id);
    }

    get(id: string): Buffer | undefined {
        return this.buffers.get(id);
    }

    pin(id: string) {
        if (this.buffers.has(id)) {
            this.pinnedBuffers.add(id);
            this.eventBus.emit(Events.BUFFER_PIN, id);
        }
    }

    unpin(id: string) {
        this.pinnedBuffers.delete(id);
        this.eventBus.emit(Events.BUFFER_UNPIN, id);
    }

    isPinned(id: string) {
        return this.pinnedBuffers.has(id);
    }

    all() {
        return Array.from(this.buffers.keys());
    }

    pinned() {
        return Array.from(this.pinnedBuffers);
    }
}
