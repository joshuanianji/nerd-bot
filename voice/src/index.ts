import { Intents } from 'discord.js';
import Client from './client';
import chalk from 'chalk';
import { refreshCommands, runCommand } from './slashCommands';
import { generateDependencyReport } from '@discordjs/voice';
try {
    // check dependencies
    console.log(`${chalk.blue('[INFO]')} DEPENDENCIES`)
    console.log(generateDependencyReport());

    // Create a new client instance
    // this client is my ExtendedClient class
    const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

    // When the client is ready, run this code (only once)
    client.once('ready', async () => {
        console.log(`${chalk.green('[INFO]')} Discord bot ready!`);
        refreshCommands(client.context);
    });

    client.on('interactionCreate', interaction => {
        if (interaction.isCommand()) {
            runCommand(client.context, interaction);
        }
    })

    client.init().catch(console.error);
} catch (e) {
    console.log(`${chalk.red('[ERROR]')} Error creating context!\n${e}`);
}
