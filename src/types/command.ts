import { ApplicationCommandDataResolvable, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Client from '../client.js';

export interface Command {
    name: string,
    // used in help menu (if i ever get to create one...)
    description: string,
    dm_permission: boolean,
    run: (client: Client, interaction: CommandInteraction) => Promise<void>;
    // update the slash command builder for custom options
    updateBuilder?: (builder: SlashCommandBuilder) => void;
}

export const serialize = (cmd: Command): ApplicationCommandDataResolvable => {
    // discord's SlashCommandBuilder() has a toJSON() method that can serialize it

    const builder = new SlashCommandBuilder()
        .setName(cmd.name)
        .setDescription(cmd.description)
        .setDMPermission(cmd.dm_permission);

    if (cmd.updateBuilder) {
        cmd.updateBuilder(builder);
    }

    return builder.toJSON();
}