import { Prisma, Reaction } from '@prisma/client';
import { getScore, scoreDeltas } from './score.js';
import { KindofDiscordMessage, upsertMessage } from './upsertMessage.js';
import { upsertUser } from './upsertUser.js';

/**
 * Add a nerd reaction to the database
 * Handles updating scores and creating new users if necessary
 * 
 * @returns 
 */
export const addNerdReaction = async <P extends Prisma.TransactionClient>(
    userId: string, msg: KindofDiscordMessage, client: P
): Promise<Reaction> => {
    // create user who reacts (userA) and user who is reacted to (userB)
    const userA = await upsertUser(userId, client);
    const userB = await upsertUser(msg.author.id, client);

    const prismaMsg = await upsertMessage(msg, client, 'incrementCounter');

    const scoreA = await getScore(userA.id, client);
    const scoreB = await getScore(userB.id, client);

    // Get score deltas, given that userA reacted to userB
    const [deltaA, deltaB] = scoreDeltas(scoreA, scoreB);

    // create a new reaction 
    return client.reaction.create({
        data: {
            user: { connect: { id: userA.id } },
            message: { connect: { id: prismaMsg.id } },
            deltaA,
            deltaB,
            createdAt: msg.createdAt
        }
    });
}

export const deleteNerdReaction = async <P extends Prisma.TransactionClient>(
    userId: string, msg: KindofDiscordMessage, client: P
): Promise<Reaction> => {
    await upsertUser(userId, client);
    const { id: messageId } = await upsertMessage(msg, client, 'decrementCounter');
    // delete a new reaction 
    return await client.reaction.delete({
        where: {
            userId_messageId: { userId, messageId },
        }
    });
}