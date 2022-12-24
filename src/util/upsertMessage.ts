import { Prisma, PrismaClient, PrismaPromise } from '@prisma/client';
import { Message } from 'discord.js';
import { Message as PrismaMessage } from '@prisma/client';
import { upsertUser } from './upsertUser';

type CounterAction = 'incrementCounter' | 'decrementCounter' | 'none';

/**
 * Finds a message by its ID (upserting user), and creates one if it doesn't exist.
 * Also, acts upon the counter.
 * 
 * Note, if you pass in a Prisma.TransactionClient, everything will be a single transaction (i think)
 * 
 * @param message Discord message (in a guild)
 * @param prisma Prisma client or Prisma Transaction Client
 * @returns PrismaMessage
 */
export const upsertMessage = async <P extends Prisma.TransactionClient>(
    message: Message<true>,
    prisma: P,
    counterAction: CounterAction
): Promise<PrismaMessage> => {
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
