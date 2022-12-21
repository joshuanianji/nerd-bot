import { Collection } from 'discord.js';

// rather than dynamically importing the commands from searching through the files,
// i'm going to import than explicitly
// https://stackoverflow.com/q/69500556
import { ping } from './ping'
import { Command } from '../types/command';
const importedCmds = [ping];

export const getCommands = (): Collection<string, Command> => {
    const commands = new Collection<string, Command>();

    for (const importedCmd of importedCmds) {
        commands.set(importedCmd.name, importedCmd)
    }

    return commands;
}