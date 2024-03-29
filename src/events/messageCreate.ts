import { Message } from 'discord.js';
import Client from '../client.js';
import { addNerdReaction, deleteNerdReaction } from '../util/collectNerdReaction.js';
import { log } from './../util/log.js';

export const messageCreate = (client: Client, message: Message) => {
    // only works in guilds
    if (!message.inGuild()) return;
    if (message.author.bot) return;

    const prisma = client.prisma;

    // set up the collector to only react to nerd emojis
    // also, set collector to run for 2 hours in prod, and 30 seconds in dev
    // whenever someone reacts with 🤓, the collector will reset the timer
    const collector = message.createReactionCollector({
        filter: (reaction, user) => reaction.emoji.name === '🤓' && !user.bot,
        time: client.config.ENV === 'dev' ? 30_000 : 2 * 60 * 60 * 1000,
        dispose: true
    });

    log.info('Message created: added reaction collector ' + message.content);

    client.incrementReactionCollector();

    collector.on('collect', async (reaction, user) => {
        try {
            if (user.id === message.author.id) return;

            await addNerdReaction(user.id, message, prisma)

            log.info(`Collected a new ${reaction.emoji.name} reaction`);
            // if we get a nerd reaction, reset the timer to 5 hous in prod, 100 seconds in dev
            // this is so we wait longer for messages that have a higher "disposition" to be nerd reacted
            // as often, people react just for the sake of reacting, but it takes more effort to be the first reaction
            collector.resetTimer({
                time: client.config.ENV === 'dev' ? 100_000 : 5 * 60 * 60 * 1000
            });
        } catch (e) {
            log.error('Failed to add reaction' + e);
            log.sendError(client.config)('Failed to add reaction!', JSON.stringify(e));
        }
    });

    collector.on('dispose', async (reaction, user) => {
        try {
            await deleteNerdReaction(user.id, message, prisma);

            log.info(`Deleted a ${reaction.emoji.name} reaction`);
            collector.resetTimer();
        } catch (e) {
            log.error('Failed to delete reaction' + e);
            log.sendError(client.config)('Failed to delete reaction!', JSON.stringify(e));
        }
    });

    // fires when the time limit or the max is reached
    collector.once('end', (collected, reason) => {
        // reactions are no longer collected
        log.info(`Collected ${collected.size} emojis. Ended because ${reason}`);
        client.decrementReactionCollector();
    });
}