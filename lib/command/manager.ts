export type CommandHandler = (args: string[]) => void;

export class CommandManager {
    private commands: Map<string, CommandHandler> = new Map();

    public register(name: string, handler: CommandHandler) {
        this.commands.set(name, handler);
    }

    public execute(commandString: string) {
        if (!commandString) return;

        const parts = commandString.trim().split(/\s+/);
        const commandName = parts[0];
        const args = parts.slice(1);

        const handler = this.commands.get(commandName);

        if (handler) {
            try {
                handler(args);
            } catch (error) {
                console.error(`Error executing command '${commandName}':`, error);
                // Optionally, display this error to the user in the command line
            }
        } else {
            console.warn(`Command not found: ${commandName}`);
            // Optionally, display this error to the user
        }
    }
}
