
export enum Events {
    // Keyboard Events
    KEYDOWN = 'keydown',
    KEYUP = 'keyup',
    KEYPRESS = 'keypress',


    // Mouse Events
    MOUSEDOWN = 'mousedown',
    MOUSEUP = 'mouseup',
    MOUSEMOVE = 'mousemove',
    CLICK = 'click',
    DBLCLICK = 'dblclick',
    CONTEXTMENU = 'contextmenu',
    WHEEL = 'wheel',
    RESIZE = 'resize',

    // Clipboard Events
    COPY = 'copy',
    CUT = 'cut',
    PASTE = 'paste',


    // Buffer Events 
    BUFFER_ADD = 'buffer_add',
    BUFFER_REMOVE = 'buffer_remove',
    BUFFER_CLEAR = 'buffer_clear',
    BUFFER_UPDATE = 'buffer_update',
    BUFFER_SELECT = 'buffer_select',
    BUFFER_RENAME = 'buffer_rename',
    BUFFER_MOVE = 'buffer_move',
    BUFFER_SWAP = 'buffer_swap',
    BUFFER_PIN = 'buffer_pin',
    BUFFER_UNPIN = 'buffer_unpin',
    BUFFER_OPEN = 'buffer_open',
    BUFFER_CLOSE = 'buffer_close',
    BUFFER_SAVE = 'buffer_save',

    // State Events
    STATE_UPDATE = 'state_update',

    // High-level Action Events
    ACTION_SET_MODE = 'action_set_mode',
    ACTION_INSERT_CHAR = 'action_insert_char',
    ACTION_MOVE_CURSOR_DOWN = 'action_move_cursor_down',
}


export class EventBus {
    private events: { [key: string]: Array<(...args: any[]) => void> } = {};

    constructor() {
        this.initialize();
    }

    on(event: string, listener: (...args: any[]) => void) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event: string, listener: (...args: any[]) => void) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }


    emit(event: string, ...args: any[]) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }

    initialize() {

        const windowEvents = [
            Events.KEYDOWN,
            Events.KEYUP,
            Events.KEYPRESS,
            Events.MOUSEDOWN,
            Events.MOUSEUP,
            Events.MOUSEMOVE,
            Events.CLICK,
            Events.DBLCLICK,
            Events.CONTEXTMENU,
            Events.WHEEL,
            Events.RESIZE,
            Events.COPY,
            Events.CUT,
            Events.PASTE,
        ];
        windowEvents.forEach(event => {
            window.addEventListener(event, (e) => {
                this.emit(event, e);
            });
        });
    }
}
