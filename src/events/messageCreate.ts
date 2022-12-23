import { Message, SlashCommandBuilder } from 'discord.js';
import Client from '../client';
import { getMessage } from '../util/getMessage';
import { getUser } from '../util/getUser';
import log from './../util/log';

export const messageCreate = (client: Client, message: Message) => {
    // only works in guilds
    if (!message.inGuild()) return;
    if (message.author.bot) return;

    const prisma = client.prisma;

    // set up the collector to only react to nerd emojis
    // also, set collector to run for 5 minutes in prod, and 10 seconds in dev
    // whenever someone reacts with 🤓, the collector will reset the timer
    const collector = message.createReactionCollector({
        filter: (reaction, user) => reaction.emoji.name === '🤓' && !user.bot,
        time: client.config.ENV === 'dev' ? 10_000 : 1000 * 60 * 5,
    });

    log.info('Message created: added reaction collector ' + message.content);

    client.incrementReactionCollector();

    collector.on('collect', async (reaction, user) => {
        // in case you want to do something when someone reacts with 🤓
        log.info(`Collected a new ${reaction.emoji.name} reaction`);

        const prismaUser = await getUser(user.id, prisma);
        const prismaMsg = await getMessage(message, prisma);
        // create a new reaction 
        await prisma.reaction.create({
            data: {
                user: { connect: { id: prismaUser.id } },
                message: { connect: { id: prismaMsg.id } },
            }
        });

        collector.resetTimer();
    });

    // fires when the time limit or the max is reached
    collector.once('end', (collected, reason) => {
        // reactions are no longer collected
        log.info(`Collected ${collected.size} emojis. Ended because ${reason}`);
        client.decrementReactionCollector();
    });
}