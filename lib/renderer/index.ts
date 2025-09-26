import { createEffect } from '@lib/reactivity';
import { state } from '@lib/state';
import type { Buffer } from '@lib/buffer';
import type { Cursor } from '@lib/cursor';
import type { Container } from '@lib/container';
import type { BufferManager } from '@lib/buffer/manager';
import type { Selection } from '@lib/state';
import type { StatusBarManager } from '@lib/statusbar';

export class Renderer {
    private then = 0;
    private canvas: HTMLCanvasElement | null = null;
    private charWidth = 0;
    private fontSize = 16;
    private lineHeight = 20;
    private fontFamily = "monospace";

    constructor(private container: Container) {
        createEffect(() => {
            // Depend on all reactive state that the renderer needs.
            const statusBarManager = this.container.get<StatusBarManager>('StatusBarManager')!;
            statusBarManager.leftText();
            statusBarManager.rightText();

            state.commandLineText(); // Depend on command line text
            state.mode(); // Depend on mode for conditional rendering

            const bufferId = state.activeBufferId();
            const cursor = state.cursor();
            const sel = state.selection(); // Dependency on selection

            // Register dependencies on cursor position for cursor and selection drawing
            cursor.row();
            cursor.col();

            const bufferManager = this.container.get<BufferManager>('BufferManager')!;
            const buffer = bufferId ? bufferManager.get(bufferId) : null;

            this.drawScene(buffer, cursor, sel);
        });
    }

    public start() {
        const ctx = (document.getElementById('canvas') as HTMLCanvasElement)?.getContext('2d');
        if (ctx) {
            ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            this.charWidth = ctx.measureText('W').width;
        }

        const loop = () => {
            requestAnimationFrame(loop);
            const now = Date.now();
            const elapsed = now - this.then;

            if (elapsed < 1000 / 60) return;

            this.then = now - (elapsed % (1000 / 60));
            this.resizeCanvas();
        }
        loop();
    }

    private drawScene(buffer: Buffer | null, cursor: Cursor, selection: Selection | null) {
        const ctx = this.canvas || document.getElementById('canvas') as HTMLCanvasElement;
        const context = ctx?.getContext('2d');
        if (!context) return;

        this.clear(context);
        if (selection) {
            this.drawSelection(context, selection, buffer?.getLines() || []);
        }
        if (buffer) {
            this.drawBuffer(context, buffer.getLines());
        }
        this.drawCursor(context, cursor);
        this.drawStatusBar(context);
    }

    private resizeCanvas() {
        const canvas = this.canvas || document.getElementById('canvas') as HTMLCanvasElement;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const cssWidth = window.innerWidth;
        const cssHeight = window.innerHeight;

        if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
            canvas.width = cssWidth * dpr;
            canvas.height = cssHeight * dpr;
            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${cssHeight}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(dpr, dpr);
            }

            const bufferId = state.activeBufferId();
            const bufferManager = this.container.get<BufferManager>('BufferManager')!;
            const buffer = bufferId ? bufferManager.get(bufferId) : null;
            this.drawScene(buffer, state.cursor(), state.selection());
        }
        this.canvas = canvas;
    }

    private clear(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#1E1E1E';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    private drawSelection(ctx: CanvasRenderingContext2D, selection: Selection, lines: string[]) {
        ctx.fillStyle = '#444444'; // Selection color
        const { start, end } = selection;

        for (let i = start.row; i <= end.row; i++) {
            const line = lines[i] || '';
            const lineStartCol = (i === start.row) ? start.col : 0;
            const lineEndCol = (i === end.row) ? end.col : line.length;

            const x = 10 + (lineStartCol * this.charWidth);
            const y = (i * this.lineHeight) + (this.lineHeight - this.fontSize) / 1.5;
            const width = (lineEndCol - lineStartCol + 1) * this.charWidth;

            if (width > 0) {
                ctx.fillRect(x, y, width, this.fontSize);
            }
        }
    }

    private drawBuffer(ctx: CanvasRenderingContext2D, lines: string[]) {
        ctx.fillStyle = '#D4D4D4';
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], 10, (i + 1) * this.lineHeight);
        }
    }

    private drawCursor(ctx: CanvasRenderingContext2D, cursor: Cursor) {
        // In visual mode, cursor is often just a border or not shown, but we'll show it for now.
        const x = 10 + (cursor.col() * this.charWidth);
        const y = (cursor.row() * this.lineHeight) + (this.lineHeight - this.fontSize) / 1.5;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, this.charWidth, this.fontSize);
    }

    private drawStatusBar(ctx: CanvasRenderingContext2D) {
        const height = this.lineHeight;
        const y = window.innerHeight - height;

        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, y, window.innerWidth, height);

        // Content
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;

        if (state.mode() === 'COMMAND') {
            const text = `:${state.commandLineText()}`;
            ctx.fillText(text, 10, y + this.fontSize - 2);
        } else {
            const statusBarManager = this.container.get<StatusBarManager>('StatusBarManager')!;
            // Left side
            const leftText = statusBarManager.leftText();
            ctx.fillText(leftText, 10, y + this.fontSize - 2);

            // Right side
            const rightText = statusBarManager.rightText();
            const textWidth = ctx.measureText(rightText).width;
            ctx.fillText(rightText, window.innerWidth - textWidth - 10, y + this.fontSize - 2);
        }
    }
}