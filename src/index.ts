import { Events, GatewayIntentBits } from 'discord.js';
import Client from './client';
import { ready } from './events/ready';
import log from './util/log';
import dotenv from 'dotenv';
import { configSchema } from './config';
import { interactionCreate } from './events/interactionCreate';
import { messageCreate } from './events/messageCreate';

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
    await messageCreate(client, message);
});
