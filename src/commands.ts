import { Collection } from 'discord.js';

// rather than dynamically importing the commands from searching through the files,
// i'm going to import than explicitly
// https://stackoverflow.com/q/69500556
import { vmstat } from './commands/vmstat.js'
import { stat } from './commands/stat.js';
import { Command } from './types/command.js';
import { botstat } from './commands/botstat.js';
import { plt } from './commands/plt.js';

const importedCmds = [vmstat, stat, botstat, plt];

export const getCommands = (): Collection<string, Command> => {
    const commands = new Collection<string, Command>();

    for (const importedCmd of importedCmds) {
        commands.set(importedCmd.name, importedCmd);
    }

    return commands;
}