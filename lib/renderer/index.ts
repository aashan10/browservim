import { createEffect, createSignal } from '@lib/reactivity';
import { state } from '@lib/state';
import type { Buffer } from '@lib/buffer';
import type { Cursor } from '@lib/cursor';
import type { Container } from '@lib/container';
import type { BufferManager } from '@lib/buffer/manager';
import type { Selection } from '@lib/state';
import type { StatusBarManager } from '@lib/statusbar';
import { config } from '@lib/config';

export class Renderer {
    private then = 0;
    private canvas: HTMLCanvasElement | null = null;
    private charWidth = 0;

    public readonly visibleLines;
    private readonly setVisibleLines;

    private postDrawHooks: ((ctx: CanvasRenderingContext2D) => void)[] = [];

    constructor(private container: Container) {
        const [visibleLines, setVisibleLines] = createSignal(0);
        this.visibleLines = visibleLines;
        this.setVisibleLines = setVisibleLines;

        createEffect(() => {
            // Depend on all reactive state that the renderer needs.
            const statusBarManager = this.container.get<StatusBarManager>('StatusBarManager')!;
            statusBarManager.leftText();
            statusBarManager.rightText();

            state.commandLineText();
            state.mode();
            state.viewTop(); // Depend on scroll position
            state.activeBufferId(); // Depend on active buffer for tab bar

            const bufferManager = this.container.get<BufferManager>('BufferManager')!;
            bufferManager.all(); // Depend on all buffers for tab bar

            const bufferId = state.activeBufferId();
            const cursor = state.cursor();
            const sel = state.selection();

            cursor.row();
            cursor.col();

            const buffer = bufferId ? bufferManager.get(bufferId) : null;

            this.drawScene(buffer, cursor, sel);
        });
    }

    public addPostDrawHook(callback: (ctx: CanvasRenderingContext2D) => void) {
        this.postDrawHooks.push(callback);
    }

    public start() {
        const ctx = (document.getElementById('canvas') as HTMLCanvasElement)?.getContext('2d');
        if (ctx) {
            ctx.font = `${config.fontSize}px ${config.fontFamily}`;
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
        this.drawTabBar(context);
        if (selection) {
            this.drawSelection(context, selection, buffer?.getLines() || []);
        }
        if (buffer) {
            this.drawBuffer(context, buffer.getLines());
        }
        this.drawCursor(context, cursor);
        this.drawStatusBar(context);
        this.drawNotifications(context);
        this.drawPostHooks(context);
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

            // Recalculate visible lines (subtract tab bar and status bar height)
            const visibleEditorHeight = cssHeight - (config.lineHeight * 2);
            this.setVisibleLines(Math.floor(visibleEditorHeight / config.lineHeight));

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

    private drawTabBar(ctx: CanvasRenderingContext2D) {
        const bufferManager = this.container.get<BufferManager>('BufferManager')!;
        const allBuffers = bufferManager.all();
        const activeBufferId = state.activeBufferId();

        const tabHeight = config.lineHeight;
        const tabY = 0; // Tab bar is at the very top

        // Background for the entire tab bar
        ctx.fillStyle = '#252526'; // Darker background for tab bar
        ctx.fillRect(0, tabY, ctx.canvas.width, tabHeight);

        ctx.font = `${config.fontSize}px ${config.fontFamily}`;
        ctx.textBaseline = 'top';

        let currentX = 10; // Starting X position for the first tab

        bufferManager.all().forEach(bufferId => {
            const bufferName = bufferId;
            const isActive = bufferId === state.activeBufferId();

            // Tab background
            if (isActive) {
                ctx.fillStyle = '#1E1E1E'; // Active tab background
                ctx.fillRect(currentX - 5, tabY, ctx.measureText(bufferName).width + 10, tabHeight);
            }

            // Tab text
            ctx.fillStyle = isActive ? '#FFFFFF' : '#808080'; // White for active, grey for inactive
            ctx.fillText(bufferName, currentX, tabY + config.paddingY);

            currentX += ctx.measureText(bufferName).width + 20; // Space between tabs
        });
    }

    private drawSelection(ctx: CanvasRenderingContext2D, selection: Selection, lines: string[]) {
        ctx.fillStyle = '#444444'; // Selection color
        const { start, end } = selection;
        const viewTop = state.viewTop();

        for (let i = start.row; i <= end.row; i++) {
            if (i < viewTop || i >= viewTop + this.visibleLines()) continue;

            const line = lines[i] || '';
            const lineStartCol = (i === start.row) ? start.col : 0;
            const lineEndCol = (i === end.row) ? end.end.col : line.length;

            const x = 10 + (lineStartCol * this.charWidth);
            const y = ((i - viewTop) * config.lineHeight) + config.lineHeight; // Shift down by tab bar height
            const width = (lineEndCol - lineStartCol + 1) * this.charWidth;

            if (width > 0) {
                ctx.fillRect(x, y, width, config.lineHeight);
            }
        }
    }

    private drawNotifications(ctx: CanvasRenderingContext2D) {

    }

    private drawBuffer(ctx: CanvasRenderingContext2D, lines: string[]) {
        ctx.font = `${config.fontSize}px ${config.fontFamily}`;
        ctx.textBaseline = 'top';
        const viewTop = state.viewTop();
        const visibleLines = this.visibleLines();
        const selection = state.selection();

        for (let i = 0; i < visibleLines; i++) {
            const lineIndex = viewTop + i;
            if (lineIndex >= lines.length) break;

            const line = lines[lineIndex];
            const y = ((i * config.lineHeight) + config.paddingY) + config.lineHeight; // Shift down by tab bar height

            const isSelected = selection && lineIndex >= selection.start.row && lineIndex <= selection.end.row;

            if (!isSelected) {
                ctx.fillStyle = '#D4D4D4';
                ctx.fillText(line, 10, y);
            } else {
                const startCol = (lineIndex === selection.start.row) ? selection.start.col : 0;
                const endCol = (lineIndex === selection.end.row) ? selection.end.col : line.length - 1;

                const pre = line.substring(0, startCol);
                const sel = line.substring(startCol, endCol + 1);
                const post = line.substring(endCol + 1);

                let x = 10;

                ctx.fillStyle = '#D4D4D4';
                ctx.fillText(pre, x, y);
                x += ctx.measureText(pre).width;

                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(sel, x, y);
                x += ctx.measureText(sel).width;

                ctx.fillStyle = '#D4D4D4';
                ctx.fillText(post, x, y);
            }
        }
    }

    private drawCursor(ctx: CanvasRenderingContext2D, cursor: Cursor) {
        const viewTop = state.viewTop();
        const y = ((cursor.row() - viewTop) * config.lineHeight) + config.lineHeight; // Shift down by tab bar height

        if (y < config.lineHeight || y > window.innerHeight - config.lineHeight) return; // Adjust bounds

        const x = 10 + (cursor.col() * this.charWidth);

        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, this.charWidth, config.lineHeight);

        ctx.globalCompositeOperation = 'source-over';
    }

    private drawStatusBar(ctx: CanvasRenderingContext2D) {
        const height = config.lineHeight;
        const y = window.innerHeight - height;

        ctx.fillStyle = '#333333';
        ctx.fillRect(0, y, window.innerWidth, height);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${config.fontSize}px ${config.fontFamily}`;
        ctx.textBaseline = 'top';

        if (state.mode() === 'COMMAND') {
            const text = `:${state.commandLineText()}`;
            ctx.fillText(text, 10, y + config.paddingY);
        } else {
            const statusBarManager = this.container.get<StatusBarManager>('StatusBarManager')!;
            const leftText = statusBarManager.leftText();
            ctx.fillText(leftText, 10, y + config.paddingY);

            const rightText = statusBarManager.rightText();
            const textWidth = ctx.measureText(rightText).width;
            ctx.fillText(rightText, window.innerWidth - textWidth - 10, y + config.paddingY);
        }
    }

    private drawPostHooks(ctx: CanvasRenderingContext2D) {
        this.postDrawHooks.forEach(hook => {
            ctx.save();
            hook(ctx);
            ctx.restore();
        });
    }
}
