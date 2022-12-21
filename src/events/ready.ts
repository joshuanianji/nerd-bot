import { ApplicationCommand, Collection } from 'discord.js';
import { serialize } from '../types/command';
import Client from './../client';
import log from './../util/log';
import chalk from 'chalk';

export const ready = async (client: Client<true>): Promise<void> => {
    log.info(`${chalk.bold(client.user.tag)} is online!`)

    if (client.application === null) {
        throw new Error('Client did not register in time, please try again');
    }

    log.info(`Registering commands`);
    const config = client.config;

    try {
        const serializedCmds = client.commands.map(serialize);
        let uploadedCmds: Collection<string, ApplicationCommand<{}>> = new Collection();
        if (config.ENV == 'dev') {
            const guild = await client.guilds.fetch(config.DEV_SERVER);

            if (guild === null) {
                log.error(`Could not find dev server ID: ${config.DEV_SERVER}`);
                return
            }
            await guild.commands.set(serializedCmds);
            uploadedCmds = await guild.commands.fetch();
        } else {
            await client.application.commands.set(serializedCmds);
            uploadedCmds = await client.application.commands.fetch();
        }

        // print out all commands
        const uploadedCmdNames = uploadedCmds.map((c) => c.name).join(", ");
        log.success(`Set ${config.ENV} slash commands: [${uploadedCmdNames}]`);
    } catch (error) {
        log.error('There was an error registering a slash command' + error);
    }
}
