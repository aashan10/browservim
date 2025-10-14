import { Events, type EventBus } from "@lib/event-bus";
import type { Buffer } from "@lib/buffer";
import { createSignal } from "@lib/reactivity";

export class BufferManager {

    private buffers: Map<string, Buffer> = new Map();
    private pinnedBuffers: Set<string> = new Set();

    public readonly all;
    private readonly setBufferOrder;

    constructor(
        private eventBus: EventBus
    ) {
        const [bufferOrder, setBufferOrder] = createSignal<string[]>([]);
        this.all = bufferOrder;
        this.setBufferOrder = setBufferOrder;
    }

    add(id: string, buffer: Buffer) {
        if (this.buffers.has(id)) return; // Don't add duplicates

        this.buffers.set(id, buffer);
        this.setBufferOrder([...this.all(), id]);
        this.eventBus.emit(Events.BUFFER_ADD, id, buffer);
    }

    remove(id: string) {
        this.buffers.delete(id);
        this.pinnedBuffers.delete(id);
        this.setBufferOrder(this.all().filter(b => b !== id));
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

    pinned() {
        return Array.from(this.pinnedBuffers);
    }
}
