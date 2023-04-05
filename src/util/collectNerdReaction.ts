import { Prisma, ReactionNew, Reaction } from '@prisma/client';
import { getScore, scoreDeltas } from './score.js';
import { KindofDiscordMessage, upsertMessage } from './upsertMessage.js';
import { upsertUser } from './upsertUser.js';

/**
 * Add a nerd reaction to the database. Handles things like the weight of the reaction, and the position of the reaction
 * TODO: this is a temporary function, to be removed once the migration is complete
 * 
 * @returns 
 */
export const addNerdReactionNew = async <P extends Prisma.TransactionClient>(
    userId: string, msg: KindofDiscordMessage, client: P
): Promise<ReactionNew> => {
    // create user who reacts (userA) and user who is reacted to (userB)
    const userA = await upsertUser(userId, client);
    const userB = await upsertUser(msg.author.id, client);

    const prismaMsg = await upsertMessage(msg, client, 'incrementCounter');

    const scoreA = await getScore(userA.id, client);
    const scoreB = await getScore(userB.id, client);

    // Get score deltas, GIVEN THAT userA reacted to userB
    const [deltaA, deltaB] = scoreDeltas(scoreA, scoreB);

    // create a new reaction 
    return client.reactionNew.create({
        data: {
            user: { connect: { id: userA.id } },
            message: { connect: { id: prismaMsg.id } },
            deltaA,
            deltaB,
            createdAt: msg.createdAt
        }
    });
}

// TODO: delete (this is just for the migration!)
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
            weight: weight * 0.1,
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