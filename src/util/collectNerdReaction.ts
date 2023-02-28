import { Prisma, Reaction } from '@prisma/client';
import { Message } from 'discord.js';
import { getScore } from './getScore';
import { KindofDiscordMessage, upsertMessage } from './upsertMessage';
import { upsertUser } from './upsertUser';

/**
 * 
 * Add a nerd reaction to the database. Handles things like the weight of the reaction, and the position of the reaction
 * 
 * @returns 
 */
export const addNerdReaction = async <P extends Prisma.TransactionClient>(
    userId: string, msg: KindofDiscordMessage, client: P
): Promise<Reaction> => {
    const prismaUser = await upsertUser(userId, client);
    const prismaMsg = await upsertMessage(msg, client, 'incrementCounter');
    const weight = await getScore(prismaUser.id, client);
    // create a new reaction 
    return client.reaction.create({
        data: {
            user: { connect: { id: prismaUser.id } },
            message: { connect: { id: prismaMsg.id } },
            position: prismaMsg.reactionCounter,
            weight: weight * 0.1
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