import type { Plugin } from '@lib/plugins/types';
import type { PluginAPI } from '@lib/plugins/api';
import { createSignal } from '@lib/reactivity';

const DemoPlugin: Plugin = {
    name: 'Demo Plugin',
    version: '0.1.0',

    install(api: PluginAPI) {
        const [enabled, setEnabled] = createSignal(true);

        // 1. Register a keymap
        api.registerKeymap('NORMAL', ' e', () => {
            setEnabled(!enabled());
        }, { description: 'Show demo plugin alert' });

        // 2. Add a status bar component
        api.addStatusBarComponent(() => '[DEMO PLUGIN]', 'right');

        // 3. Hook into the render loop
        api.addPostDrawHook((ctx) => {
            // Draw a semi-transparent red square in the top-left corner
            if (enabled()) {

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                const width = window.innerWidth / 2;
                const height = window.innerHeight / 2;
                const top = window.innerHeight / 4;
                const left = window.innerWidth / 4;
                ctx.fillRect(left, top, width, height);
            }
        });

        // 4. Listen for an event
        api.on('action_set_mode', (mode) => {
            console.log(`Plugin saw mode change to: ${mode}`);
        });
    }
};

export default DemoPlugin;
