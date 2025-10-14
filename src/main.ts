import { Container } from '@lib/container';
import { EventBus } from '@lib/event-bus';
import { Keymaps } from '@lib/keymaps';
import { Renderer } from '@lib/renderer';
import { BufferManager } from '@lib/buffer/manager';
import { Buffer } from '@lib/buffer';
import { actions, state } from '@lib/state';
import { InputManager } from '@lib/input';
import { createEffect } from '@lib/reactivity';
import { registerKeymaps } from './keymaps';
import { StatusBarManager } from '@lib/statusbar';
import { CommandManager } from '@lib/command/manager';
import { PluginManager } from '@lib/plugins/manager';

// --- App Setup ---
const container = new Container();

// Register services
const eventBus = new EventBus();
const keymaps = new Keymaps();
const statusBarManager = new StatusBarManager();
const commandManager = new CommandManager();
const bufferManager = new BufferManager(eventBus);

container.set('EventBus', eventBus);
container.set('Keymaps', keymaps);
container.set('StatusBarManager', statusBarManager);
container.set('CommandManager', commandManager);
container.set('BufferManager', bufferManager);

// Services that depend on a populated container are created last.
const renderer = new Renderer(container);
const inputManager = new InputManager(eventBus, keymaps, container);
container.set('Renderer', renderer);
container.set('InputManager', inputManager);

// --- Plugin Setup ---
const pluginManager = new PluginManager(container);
pluginManager.installPlugins();

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

commandManager.register('e', (args) => {
    const bufferName = args[0];
    if (!bufferName) {
        // TODO: Show error to user
        console.error('No buffer name provided to :e');
        return;
    }

    const existingBuffer = bufferManager.get(bufferName);
    if (existingBuffer) {
        actions.setActiveBufferId(bufferName);
    } else {
        const newBuffer = new Buffer(bufferName, '');
        bufferManager.add(bufferName, newBuffer);
        actions.setActiveBufferId(bufferName);
    }
});

// --- Initial Buffer Setup ---
const initialContent = `Welcome to nvim.ts!\n\nThis is a test buffer.\nPress 'i' to enter INSERT mode.\nPress <Esc> to return to NORMAL mode.\n`;

const welcomeBuffer = new Buffer('~Welcome', initialContent, { readonly: true, filetype: 'welcome' });
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

// --- Scrolling Logic ---
createEffect(() => {
    const cursorRow = state.cursor().row();
    const viewTop = state.viewTop();
    const visibleLines = renderer.visibleLines();
    bufferManager.all(); // Depend on all buffers for tab bar redraws

    if (visibleLines === 0) return;

    if (cursorRow < viewTop) {
        actions.setViewTop(cursorRow);
    } else if (cursorRow >= viewTop + visibleLines) {
        actions.setViewTop(cursorRow - visibleLines + 1);
    }
});

// --- Start the render loop ---
renderer.start();