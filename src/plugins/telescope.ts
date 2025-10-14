import type { Plugin } from '@lib/plugins/types';
import type { PluginAPI } from '@lib/plugins/api';
import { createSignal, createEffect } from '@lib/reactivity';
import type { Buffer } from '@lib/buffer';
import { Buffer as BufferClass } from '@lib/buffer';
import { config } from '@lib/config';
import { actions, state } from '@lib/state';

interface TelescopeResult {
    id: string;
    display: string;
    buffer?: Buffer;
    action: () => void;
}

// Telescope state signals
const [selectedIndex, setSelectedIndex] = createSignal(0);
const [isOpen, setIsOpen] = createSignal(false);
const [results, setResults] = createSignal<TelescopeResult[]>([]);
const [title, setTitle] = createSignal('');
const [originalItems, setOriginalItems] = createSignal<TelescopeResult[]>([]);
const [originalBufferId, setOriginalBufferId] = createSignal<string | null>(null);

class TelescopeFinder {
    private api: PluginAPI;
    private telescopeBuffer: BufferClass | null = null;
    private originalMode: string = 'NORMAL';

    constructor(api: PluginAPI) {
        this.api = api;
    }

    private setupReactiveSearch() {
        // Create reactive effect to update results when search query changes
        // This needs to be called after telescopeBuffer is created
        createEffect(() => {
            if (!isOpen() || !this.telescopeBuffer) return;
            
            // Access the buffer's reactive lines to trigger the effect
            const lines = this.telescopeBuffer.getLines();
            const searchQuery = lines[0] || ''; // First line is the search query
            const items = originalItems();
            
            // Debug logging
            console.log('Telescope search query changed:', searchQuery);
            console.log('Available items:', items.length);
            
            // Update results whenever the search query changes
            this.updateResults(searchQuery, items);
        });
    }

    // Fuzzy search algorithm - simple but effective
    private fuzzyMatch(query: string, text: string): { score: number; matches: number[] } {
        if (!query) return { score: 1, matches: [] };

        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        const matches: number[] = [];
        let queryIndex = 0;
        let score = 0;

        for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
            if (textLower[i] === queryLower[queryIndex]) {
                matches.push(i);
                score += queryLower.length - queryIndex; // Earlier matches score higher
                queryIndex++;
            }
        }

        if (queryIndex === queryLower.length) {
            score += (100 - text.length); // Shorter matches score higher
            return { score, matches };
        }

        return { score: -1, matches: [] };
    }

    private updateResults(query: string, items: TelescopeResult[]) {
        console.log('updateResults called with query:', `"${query}"`, 'items:', items.length);
        
        if (!query.trim()) {
            console.log('Empty query, showing all items');
            setResults(items);
            setSelectedIndex(0);
            return;
        }

        const scored = items
            .map(item => ({
                ...item,
                ...this.fuzzyMatch(query, item.display)
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);

        console.log('Filtered results:', scored.length, 'matches');
        setResults(scored);
        setSelectedIndex(0);
    }

    open(title: string, items: TelescopeResult[]) {
        this.originalMode = this.api.getState().mode();
        setOriginalBufferId(state.activeBufferId());
        setTitle(title);
        setOriginalItems(items);
        setIsOpen(true);
        setSelectedIndex(0);

        // Create telescope buffer for input
        this.telescopeBuffer = new BufferClass('__telescope__', '', { 
            readonly: false, 
            filetype: 'telescope' 
        });

        // Add telescope buffer to buffer manager and switch to it
        const container = (window as any).$container;
        const bufferManager = container.get('BufferManager');
        bufferManager.add('__telescope__', this.telescopeBuffer);
        actions.setActiveBufferId('__telescope__');
        actions.setMode('INSERT'); // Start in insert mode for immediate typing

        // Set up temporary keymaps for telescope navigation
        this.setupTemporaryKeymaps();

        // Set up reactive search after buffer is created
        this.setupReactiveSearch();

        // Initialize results
        this.updateResults('', items);
    }

    close() {
        setIsOpen(false);
        setResults([]);
        setSelectedIndex(0);

        // Remove telescope buffer
        const container = (window as any).$container;
        const bufferManager = container.get('BufferManager');
        bufferManager.remove('__telescope__');

        // Restore original buffer and mode
        const originalId = originalBufferId();
        if (originalId) {
            actions.setActiveBufferId(originalId);
        }
        actions.setMode(this.originalMode);

        // Clear telescope buffer reference
        this.telescopeBuffer = null;

        // Clear temporary keymaps
        this.clearTemporaryKeymaps();
    }

    private setupTemporaryKeymaps() {
        // Navigation in INSERT mode while in telescope buffer
        this.api.registerKeymap('INSERT', '<Down>', () => {
            if (!isOpen() || state.activeBufferId() !== '__telescope__') return;
            const currentResults = results();
            if (currentResults.length > 0) {
                setSelectedIndex((selectedIndex() + 1) % currentResults.length);
            }
        });

        this.api.registerKeymap('INSERT', '<Up>', () => {
            if (!isOpen() || state.activeBufferId() !== '__telescope__') return;
            const currentResults = results();
            if (currentResults.length > 0) {
                setSelectedIndex((selectedIndex() - 1 + currentResults.length) % currentResults.length);
            }
        });

        this.api.registerKeymap('INSERT', '<C-j>', () => {
            if (!isOpen() || state.activeBufferId() !== '__telescope__') return;
            const currentResults = results();
            if (currentResults.length > 0) {
                setSelectedIndex((selectedIndex() + 1) % currentResults.length);
            }
        });

        this.api.registerKeymap('INSERT', '<C-k>', () => {
            if (!isOpen() || state.activeBufferId() !== '__telescope__') return;
            const currentResults = results();
            if (currentResults.length > 0) {
                setSelectedIndex((selectedIndex() - 1 + currentResults.length) % currentResults.length);
            }
        });

        // Selection
        this.api.registerKeymap('INSERT', '<Enter>', () => {
            if (!isOpen() || state.activeBufferId() !== '__telescope__') return;
            const currentResults = results();
            const currentIndex = selectedIndex();
            const selected = currentResults[currentIndex];
            
            console.log('Telescope Enter pressed:');
            console.log('- Results count:', currentResults.length);
            console.log('- Selected index:', currentIndex);
            console.log('- Selected item:', selected);
            
            if (selected) {
                console.log('Executing action for:', selected.display);
                selected.action();
                this.close();
            } else {
                console.log('No selected item found!');
            }
        });

        // Exit
        this.api.registerKeymap('INSERT', '<Esc>', () => {
            if (isOpen() && state.activeBufferId() === '__telescope__') {
                this.close();
            }
        });

        // Also add NORMAL mode keymaps for when user presses Esc in telescope buffer
        this.api.registerKeymap('NORMAL', 'j', () => {
            if (!isOpen() || state.activeBufferId() !== '__telescope__') return;
            const currentResults = results();
            if (currentResults.length > 0) {
                setSelectedIndex((selectedIndex() + 1) % currentResults.length);
            }
        });

        this.api.registerKeymap('NORMAL', 'k', () => {
            if (!isOpen() || state.activeBufferId() !== '__telescope__') return;
            const currentResults = results();
            if (currentResults.length > 0) {
                setSelectedIndex((selectedIndex() - 1 + currentResults.length) % currentResults.length);
            }
        });

        this.api.registerKeymap('NORMAL', '<Enter>', () => {
            if (!isOpen() || state.activeBufferId() !== '__telescope__') return;
            const currentResults = results();
            const currentIndex = selectedIndex();
            const selected = currentResults[currentIndex];
            
            console.log('Telescope NORMAL Enter pressed:');
            console.log('- Results count:', currentResults.length);
            console.log('- Selected index:', currentIndex);
            console.log('- Selected item:', selected);
            
            if (selected) {
                console.log('Executing action for:', selected.display);
                selected.action();
                this.close();
            } else {
                console.log('No selected item found!');
            }
        });

        this.api.registerKeymap('NORMAL', 'q', () => {
            if (isOpen() && state.activeBufferId() === '__telescope__') {
                this.close();
            }
        });

        this.api.registerKeymap('NORMAL', 'i', () => {
            if (isOpen() && state.activeBufferId() === '__telescope__') {
                actions.setMode('INSERT');
            }
        });
    }

    private clearTemporaryKeymaps() {
        // In a real implementation, we'd have a way to remove specific keymaps
        // For now, just log that we're clearing
        console.log('Clearing telescope temporary keymaps');
    }

    // Getters for rendering
    getState() {
        return {
            isOpen: isOpen(),
            searchQuery: this.telescopeBuffer?.getLines()[0] || '',
            results: results(),
            selectedIndex: selectedIndex(),
            title: title()
        };
    }
}

const TelescopePlugin: Plugin = {
    name: 'Telescope',
    version: '1.0.0',

    install(api: PluginAPI) {
        const telescope = new TelescopeFinder(api);

        // Register telescope commands
        api.registerKeymap('NORMAL', ' ff', () => {
            // Find buffers picker
            const state = api.getState();
            const container = (window as any).$container; // Access container for buffer manager
            const bufferManager = container.get('BufferManager');
            const allBuffers = bufferManager.all();

            const items: TelescopeResult[] = allBuffers.map((bufferId: string) => {
                const buffer = bufferManager.get(bufferId);
                return {
                    id: bufferId,
                    display: buffer?.name || bufferId,
                    buffer,
                    action: () => {
                        console.log(`Attempting to switch to buffer: ${bufferId}`);
                        try {
                            actions.setActiveBufferId(bufferId);
                            console.log(`Successfully switched to buffer: ${bufferId}`);
                        } catch (error) {
                            console.error(`Failed to switch to buffer ${bufferId}:`, error);
                        }
                    }
                };
            });

            telescope.open('Find Buffers', items);
        }, { description: 'Telescope: Find buffers' });

        // Alternative keymap
        api.registerKeymap('NORMAL', ' p', () => {
            // Same as above, but with a different key
            const state = api.getState();
            const container = (window as any).$container;
            const bufferManager = container.get('BufferManager');
            const allBuffers = bufferManager.all();

            const items: TelescopeResult[] = allBuffers.map((bufferId: string) => {
                const buffer = bufferManager.get(bufferId);
                return {
                    id: bufferId,
                    display: `${buffer?.name || bufferId} ${buffer?.config.filetype ? `[${buffer.config.filetype}]` : ''}`,
                    buffer,
                    action: () => {
                        console.log(`Attempting to switch to buffer: ${bufferId}`);
                        try {
                            actions.setActiveBufferId(bufferId);
                            console.log(`Successfully switched to buffer: ${bufferId}`);
                        } catch (error) {
                            console.error(`Failed to switch to buffer ${bufferId}:`, error);
                        }
                    }
                };
            });

            telescope.open('Buffers', items);
        }, { description: 'Telescope: Quick buffer switch' });

        // Add telescope UI rendering
        api.addPostDrawHook((ctx: CanvasRenderingContext2D) => {
            const telescopeState = telescope.getState();

            if (!telescopeState.isOpen) return;

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const width = Math.min(800, window.innerWidth * 0.8);
            const height = Math.min(600, window.innerHeight * 0.8);
            const x = centerX - width / 2;
            const y = centerY - height / 2;

            // Background overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            // Main telescope window
            ctx.fillStyle = '#2D2D2D';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = '#4A4A4A';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Title
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${config.fontSize + 2}px ${config.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.fillText(telescopeState.title, centerX, y + 30);

            // Search box
            const searchY = y + 60;
            const searchHeight = 40;
            ctx.fillStyle = '#1E1E1E';
            ctx.fillRect(x + 20, searchY, width - 40, searchHeight);
            ctx.strokeStyle = '#4A4A4A';
            ctx.strokeRect(x + 20, searchY, width - 40, searchHeight);

            // Search text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `${config.fontSize}px ${config.fontFamily}`;
            ctx.textAlign = 'left';
            const searchText = telescopeState.searchQuery || '';
            ctx.fillText(`> ${searchText}`, x + 30, searchY + 25);

            // Cursor in search box
            const searchTextWidth = ctx.measureText(`> ${searchText}`).width;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 30 + searchTextWidth, searchY + 8, 2, 24);

            // Results area
            const resultsY = searchY + searchHeight + 20;
            const resultsHeight = height - (resultsY - y) - 20;
            const lineHeight = config.lineHeight + 4;
            const visibleResults = Math.floor(resultsHeight / lineHeight);

            telescopeState.results.slice(0, visibleResults).forEach((result, index) => {
                const itemY = resultsY + (index * lineHeight);

                // Highlight selected item
                if (index === telescopeState.selectedIndex) {
                    ctx.fillStyle = '#404040';
                    ctx.fillRect(x + 10, itemY - 2, width - 20, lineHeight);
                }

                // Result text
                ctx.fillStyle = index === telescopeState.selectedIndex ? '#FFFFFF' : '#CCCCCC';
                ctx.font = `${config.fontSize}px ${config.fontFamily}`;
                ctx.textAlign = 'left';

                // Truncate long results
                let displayText = result.display;
                const maxWidth = width - 60;
                while (ctx.measureText(displayText).width > maxWidth && displayText.length > 0) {
                    displayText = displayText.slice(0, -1);
                }
                if (displayText !== result.display) {
                    displayText += '...';
                }

                ctx.fillText(displayText, x + 30, itemY + lineHeight - 8);
            });

            // Status line at bottom
            const statusText = `${telescopeState.results.length} results`;
            ctx.fillStyle = '#888888';
            ctx.font = `${config.fontSize - 2}px ${config.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.fillText(statusText, centerX, y + height - 10);

            // Instructions
            const instructions = '↑↓/jk: navigate  Enter: select  Esc/q: close';
            ctx.fillStyle = '#666666';
            ctx.font = `${config.fontSize - 2}px ${config.fontFamily}`;
            ctx.fillText(instructions, centerX, y + height - 30);
        });

        // Add status bar indicator when telescope is open
        api.addStatusBarComponent(() => {
            const telescopeState = telescope.getState();
            return telescopeState.isOpen ? '[TELESCOPE]' : '';
        }, 'right');

        // Replace the old UI rendering with buffer-based approach
        api.addPostDrawHook((ctx: CanvasRenderingContext2D) => {
            const currentBufferId = api.getState().activeBufferId();
            if (currentBufferId !== '__telescope__' || !isOpen()) return;

            const telescopeState = telescope.getState();
            
            // Custom rendering for telescope buffer - shows results sidebar
            const width = window.innerWidth;
            const height = window.innerHeight;
            const sidebarWidth = Math.min(400, width * 0.4);
            
            // Results sidebar
            const resultsX = width - sidebarWidth + 10;
            const resultsY = config.lineHeight * 2 + 20; // Below tabs and title
            const resultsHeight = height - resultsY - config.lineHeight - 20; // Leave space for status bar
            
            ctx.fillStyle = '#252526';
            ctx.fillRect(resultsX - 10, resultsY, sidebarWidth, resultsHeight);
            ctx.strokeStyle = '#3E3E3E';
            ctx.strokeRect(resultsX - 10, resultsY, sidebarWidth, resultsHeight);

            // Results header
            ctx.fillStyle = '#CCCCCC';
            ctx.font = `bold ${config.fontSize}px ${config.fontFamily}`;
            ctx.textAlign = 'left';
            ctx.fillText(`🔭 ${telescopeState.title}`, resultsX, resultsY + 25);
            
            ctx.fillStyle = '#888888';
            ctx.font = `${config.fontSize - 1}px ${config.fontFamily}`;
            ctx.fillText(`${telescopeState.results.length} matches`, resultsX, resultsY + 45);

            // Results list
            const lineHeight = config.lineHeight + 2;
            const visibleResults = Math.floor((resultsHeight - 60) / lineHeight);
            const resultsList = telescopeState.results.slice(0, visibleResults);

            resultsList.forEach((result, index) => {
                const itemY = resultsY + 60 + (index * lineHeight);
                
                // Highlight selected item
                if (index === telescopeState.selectedIndex) {
                    ctx.fillStyle = '#404040';
                    ctx.fillRect(resultsX - 5, itemY - 2, sidebarWidth - 10, lineHeight);
                }

                // Result text
                ctx.fillStyle = index === telescopeState.selectedIndex ? '#FFFFFF' : '#CCCCCC';
                ctx.font = `${config.fontSize - 1}px ${config.fontFamily}`;
                
                // Truncate long results
                let displayText = result.display;
                const maxWidth = sidebarWidth - 30;
                while (ctx.measureText(displayText).width > maxWidth && displayText.length > 0) {
                    displayText = displayText.slice(0, -1);
                }
                if (displayText !== result.display) {
                    displayText += '...';
                }
                
                ctx.fillText(displayText, resultsX, itemY + lineHeight - 4);
            });

            // Instructions at the bottom
            const instructY = height - config.lineHeight - 10;
            ctx.fillStyle = '#666666';
            ctx.font = `${config.fontSize - 2}px ${config.fontFamily}`;
            ctx.textAlign = 'left';
            ctx.fillText('↑↓/Ctrl+jk: navigate • Enter: select • Esc: close • Type to filter', 20, instructY);
        });

        console.log('Telescope plugin installed! Use <Space>ff or <Space>p to open buffer picker.');
    }
};

export default TelescopePlugin;
