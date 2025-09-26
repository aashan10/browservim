import { Container } from '@lib/container';
import { EventBus } from '@lib/event-bus';
import { Keymaps } from '@lib/keymaps';
import { Renderer } from '@lib/renderer';
import { BufferManager } from '@lib/buffer/manager';
import { Buffer } from '@lib/buffer';
import { actions, state } from '@lib/state';
import { InputManager } from '@lib/input';
import { registerKeymaps } from './keymaps';
import { StatusBarManager } from '@lib/statusbar';
import { CommandManager } from '@lib/command/manager';

// --- App Setup ---
const container = new Container();

// Register services
const eventBus = new EventBus();
const keymaps = new Keymaps();
const statusBarManager = new StatusBarManager();
const commandManager = new CommandManager();
container.set('EventBus', eventBus);
container.set('Keymaps', keymaps);
container.set('StatusBarManager', statusBarManager);
container.set('CommandManager', commandManager);
container.set('Renderer', new Renderer(container));
container.set('BufferManager', new BufferManager(eventBus));
container.set('InputManager', new InputManager(eventBus, keymaps, container));

// --- Global Access for Debugging ---
// @ts-ignore
window.$container = container;

// --- Keymap Setup ---
registerKeymaps(container);

// --- Command Setup ---
commandManager.register('q', () => {
    // For now, quitting just logs a message.
    console.log('Quitting!');
});

// --- Initial Buffer Setup ---
const bufferManager = container.get<BufferManager>('BufferManager')!;

const initialContent = `Welcome to nvim.ts!\n\nThis is a test buffer.\nPress 'i' to enter INSERT mode.\nPress <Esc> to return to NORMAL mode.\n`;

const welcomeBuffer = new Buffer('~Welcome', initialContent);
bufferManager.add(welcomeBuffer.name, welcomeBuffer);

// --- Set Initial State ---
actions.setActiveBufferId(welcomeBuffer.name);

// --- Status Bar Setup ---
statusBarManager.addLeft(() => `-- ${state.mode()} --`);
statusBarManager.addLeft(() => {
    const bufferId = state.activeBufferId();
    if (!bufferId) return '';
    const buffer = bufferManager.get(bufferId);
    return buffer ? buffer.name : '';
});
statusBarManager.addRight(() => {
    const cursor = state.cursor();
    return `${cursor.row() + 1}:${cursor.col() + 1}`;
});

// --- Start the render loop ---
const renderer = container.get<Renderer>('Renderer')!;
renderer.start();