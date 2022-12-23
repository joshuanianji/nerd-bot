import { Prisma, PrismaClient, PrismaPromise } from '@prisma/client';
import { Message } from 'discord.js';
import { Message as PrismaMessage } from '@prisma/client';
import { upsertUser } from './upsertUser';


/**
 * Finds a message by its ID (upserting user), and creates one if it doesn't exist.
 * 
 * Note, if you pass in a Prisma.TransactionClient, everything will be a single transaction (i think)
 * 
 * @param message Discord message (in a guild)
 * @param prisma Prisma client or Prisma Transaction Client
 * @returns PrismaMessage
 */
export const upsertMessage = async <P extends Prisma.TransactionClient>(
    message: Message<true>,
    prisma: P
): Promise<PrismaMessage> => {
    await upsertUser(message.author.id, prisma);
    return await prisma.message.upsert({
        where: { id: message.id },
        update: {},
        create: {
            id: message.id,
            channelId: message.channelId,
            guildId: message.guildId,
            author: { connect: { id: message.author.id } },
            createdAt: message.createdAt
        }
    });
}
