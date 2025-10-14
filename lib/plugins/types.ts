import type { PluginAPI } from './api';

/**
 * The interface that all plugins must implement.
 */
export interface Plugin {
    /**
     * A unique name for the plugin.
     */
    name: string;
    /**
     * The version of the plugin.
     */
    version: string;
    /**
     * The entry point of the plugin. This function is called once at startup.
     * It receives a curated, secure API object that allows the plugin to
     * interact with and extend the editor's core functionality.
     * @param api The curated plugin API.
     */
    install(api: PluginAPI): void;
}
