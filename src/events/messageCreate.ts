import { Message, SlashCommandBuilder } from 'discord.js';
import Client from '../client';
import { upsertMessage } from '../util/upsertMessage';
import { upsertUser } from '../util/upsertUser';
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
        dispose: true
    });

    log.info('Message created: added reaction collector ' + message.content);

    client.incrementReactionCollector();

    collector.on('collect', async (reaction, user) => {
        await prisma.$transaction(async tx => {
            const prismaUser = await upsertUser(user.id, tx);
            const prismaMsg = await upsertMessage(message, tx);
            // create a new reaction 
            await tx.reaction.create({
                data: {
                    user: { connect: { id: prismaUser.id } },
                    message: { connect: { id: prismaMsg.id } },
                }
            });
        });

        log.info(`Collected a new ${reaction.emoji.name} reaction`);
        collector.resetTimer();
    });

    collector.on('dispose', async (reaction, user) => {
        await prisma.$transaction(async tx => {
            const { id: userId } = await upsertUser(user.id, tx);
            const { id: messageId } = await upsertMessage(message, tx);
            // delete a new reaction 
            await tx.reaction.delete({
                where: {
                    userId_messageId: { userId, messageId },
                }
            });
        })

        log.info(`Deleted a ${reaction.emoji.name} reaction`);
        collector.resetTimer();
    });

    // fires when the time limit or the max is reached
    collector.once('end', (collected, reason) => {
        // reactions are no longer collected
        log.info(`Collected ${collected.size} emojis. Ended because ${reason}`);
        client.decrementReactionCollector();
    });
}