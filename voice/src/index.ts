import { Intents } from 'discord.js';
import Client from './client';
import chalk from 'chalk';
import { refreshCommands } from './slashCommands';

try {
    // Create a new client instance
    // this client is my ExtendedClient class
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

    // When the client is ready, run this code (only once)
    client.once('ready', async () => {
        console.log(`${chalk.green('[INFO]')} Discord bot ready!`);
        refreshCommands(client.context);
    });

    client.init().catch(console.error);
} catch (e) {
    console.log(`${chalk.red('[ERROR]')} Error creating context!\n${e}`);
}

