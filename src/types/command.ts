import { ApplicationCommandDataResolvable, CommandInteraction } from 'discord.js';
import Client from '../client';

export interface Command {
    name: string,
    // used in help menu (if i ever get to create one...)
    description: string,
    dm_permission: boolean,
    run: (client: Client, interaction: CommandInteraction) => Promise<void>;
}

export const serialize = ({ name, description, dm_permission }: Command): ApplicationCommandDataResolvable => {
    // looks like everything you can put in SlashCommandBuilder() should be put here
    // so NO metadata, and no function
    // https://discordjs.guide/creating-your-bot/command-deployment.html#guild-commands
    // https://discordjs.guide/creating-your-bot/command-handling.html#executing-commands
    return { name, description, dm_permission }
}