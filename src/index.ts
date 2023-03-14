import { Events, GatewayIntentBits } from 'discord.js';
import Client from './client.js';
import { ready } from './events/ready.js';
import { log } from './util/log.js';
import dotenv from 'dotenv';
import { configSchema } from './config.js';
import { interactionCreate } from './events/interactionCreate.js';
import { messageCreate } from './events/messageCreate.js';

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
client.init().catch(e => log.sendError(client.config)('Failure on init!', e));


// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async _ => {
    ready(client).catch(e => log.sendError(client.config)('Failure on clientReady', e))
});


client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    await interactionCreate(client, interaction);
});

client.on(Events.MessageCreate, async message => {
    messageCreate(client, message);
});

client.on(Events.GuildCreate, async guild => {
    log.sendInfo(client.config)('GUILD INFO', `Joined guild ${guild.name} (${guild.id})`);
});

client.on(Events.GuildDelete, async guild => {
    log.sendInfo(client.config)('GUILD INFO', `Removed from guild ${guild.name} (${guild.id})`);
});