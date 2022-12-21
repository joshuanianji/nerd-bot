import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import Client from '../client';
import log from '../util/log';
import chalk from 'chalk';

// runs whenever an interaction is created
// NOTE: this interaction must have been "preprocessed" to ensure it is a ChatInputCommandInteraction

export const interactionCreate = async (
    client: Client,
    interaction: ChatInputCommandInteraction<CacheType>
): Promise<void> => {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        log.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        log.info(`Running command ${chalk.bold(command.name)}...`)
        await command.run(client, interaction);
        log.success(`Successfully ran command ${chalk.bold(command.name)}!`)
    } catch (error) {
        log.error(`Error running command ${chalk.bold(command.name)}!`);
        console.log(command);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
}
