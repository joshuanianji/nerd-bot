import { Events, GatewayIntentBits } from 'discord.js';
import Client from './client';
import { ready } from './events/ready';
import log from './util/log';
import dotenv from 'dotenv';
import { configSchema } from './config';
import { interactionCreate } from './events/interactionCreate';

// read env vars
// https://sergiodxa.com/articles/using-zod-to-safely-read-env-variables
dotenv.config();
const config = configSchema.parse(process.env);


// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ]
}, config);
client.init().catch(log.error);


// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async c => {
    await ready(client);
});


client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    await interactionCreate(client, interaction);
});

client.on(Events.MessageCreate, async message => {

    // set up the collector to only react to nerd emojis
    // TODO: set collector to run for 15 minutes
    const collector = message.createReactionCollector({
        filter: (reaction, user) => reaction.emoji.name === '🤓',
        time: 10_000
    });

    collector.on('collect', (reaction) => {
        // in case you want to do something when someone reacts with 🤓
        console.log(`Collected a new ${reaction.emoji.name} reaction`);
    });

    // fires when the time limit or the max is reached
    collector.on('end', (collected, reason) => {
        // reactions are no longer collected
        console.log(`Collected ${collected.size} emojis. Ended because ${reason}`);
    });
})
