// database related utility functions

import { Prisma, User, Message } from '@prisma/client';
/**
 * gets user from prisma DB, and creates one if it doesn't exist
 * 
 * https://github.com/prisma/prisma/discussions/5815
 * @param id user id
 * @param prisma prisma client OR prisma transaction client
 * @returns the User object
 */
export const upsertUser = async <P extends Prisma.TransactionClient>(id: string, client: P): Promise<User> =>
    await client.user.upsert({
        where: { id },
        update: {},
        create: {
            id
        },
    });

/**
 * Finds a message by its ID (upserting user), and creates one if it doesn't exist.
 * Also, acts upon the counter.
 * 
 * Note, if you pass in a Prisma.TransactionClient, everything will be a single transaction (i think)
 * 
 * @param message Discord message (in a guild)
 * @param prisma Prisma client or Prisma Transaction Client
 * @returns Message
 */
export const upsertMessage = async <P extends Prisma.TransactionClient>(
    message: KindofDiscordMessage,
    prisma: P,
    counterAction: CounterAction
): Promise<Message> => {
    await upsertUser(message.author.id, prisma);
    return await prisma.message.upsert({
        where: { id: message.id },
        update: getUpdate(counterAction),
        create: {
            id: message.id,
            channelId: message.channelId,
            guildId: message.guildId,
            author: { connect: { id: message.author.id } },
            createdAt: message.createdAt
        }
    });
}

const getUpdate = (action: CounterAction): Prisma.XOR<Prisma.MessageUpdateInput, Prisma.MessageUncheckedUpdateInput> => {
    if (action === 'decrementCounter') {
        return { reactionCounter: { decrement: 1 } };
    } else if (action === 'incrementCounter') {
        return { reactionCounter: { increment: 1 } };
    } else {
        return {}
    }
}

type CounterAction = 'incrementCounter' | 'decrementCounter' | 'none';

// not sure about the design pattern here...
// but inside upsertMessage, I want to pass in a Message<true> type (from discord.js)
// but in prisma/seed.dev.ts, I don't have access to construct a discord message from scratch
// so the KindofDiscordMessage serves as a subtype of Message<true> that I can construct myself
// the good thing is, Message<true> being a supertype means we don't have to change much in the code
export type KindofDiscordMessage = {
    author: KindofDiscordUser,
    id: string,
    channelId: string,
    guildId: string,
    createdAt: Date,
}

type KindofDiscordUser = {
    id: string,
}