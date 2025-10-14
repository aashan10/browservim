import type { Container } from '@lib/container';
import { PluginAPI } from './api';
import type { Plugin } from './types';

// Use Vite's import.meta.glob to find all plugin files.
// The `eager: true` option imports the modules right away.
const pluginModules = import.meta.glob('/src/plugins/**/*.ts', { eager: true });

/**
 * Discovers, loads, and installs all plugins for the editor.
 */
export class PluginManager {
    private api: PluginAPI;

    constructor(private container: Container) {
        this.api = new PluginAPI(this.container);
    }

    /**
     * Loads all plugin modules from the `src/plugins` directory and runs
     * their `install` methods.
     */
    installPlugins() {
        console.log(`Found ${Object.keys(pluginModules).length} plugin modules.`);

        for (const path in pluginModules) {
            const module = pluginModules[path] as { default?: Plugin };
            const plugin = module.default;

            if (this.isValidPlugin(plugin)) {
                try {
                    console.log(`Installing plugin: ${plugin.name} v${plugin.version}`);
                    plugin.install(this.api);
                } catch (e) {
                    console.error(`Error installing plugin ${plugin.name}:`, e);
                }
            } else {
                console.warn(`Found invalid plugin module at ${path}. Does it have a default export implementing the Plugin interface?`);
            }
        }
    }

    private isValidPlugin(plugin: any): plugin is Plugin {
        return plugin &&
               typeof plugin.name === 'string' &&
               typeof plugin.version === 'string' &&
               typeof plugin.install === 'function';
    }
}
