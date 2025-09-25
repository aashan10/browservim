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

// --- App Setup ---
const container = new Container();

// Register services
const eventBus = new EventBus();
const keymaps = new Keymaps();
container.set('EventBus', eventBus);
container.set('Keymaps', keymaps);
container.set('Renderer', new Renderer(container));
container.set('BufferManager', new BufferManager(eventBus));
container.set('InputManager', new InputManager(eventBus, keymaps, container));

// --- Global Access for Debugging ---
// @ts-ignore
window.$container = container;

// --- Keymap Setup ---
registerKeymaps(container);

// --- Initial Buffer Setup ---
const bufferManager = container.get<BufferManager>('BufferManager')!;

const initialContent = `Welcome to nvim.ts!\n\nThis is a test buffer.\nPress 'i' to enter INSERT mode.\nPress <Esc> to return to NORMAL mode.\n`;

const welcomeBuffer = new Buffer('~Welcome', initialContent);
bufferManager.add(welcomeBuffer.name, welcomeBuffer);

// --- Set Initial State ---
actions.setActiveBufferId(welcomeBuffer.name);

// --- Debug Logging ---
createEffect(() => {
    console.log(`Mode changed to: ${state.mode()}`);
});

// --- Start the render loop ---
const renderer = container.get<Renderer>('Renderer')!;
renderer.start();
