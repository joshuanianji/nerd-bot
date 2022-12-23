import { PrismaClient } from '@prisma/client';
import { Message } from 'discord.js';
import { Message as PrismaMessage } from '@prisma/client';
import { getUser } from './getUser';

// get message from Prisma, or create if it doesn't exist
export const getMessage = async (message: Message<true>, prisma: PrismaClient): Promise<PrismaMessage> => {
    const prismaMessage = await prisma.message.findUnique({
        where: {
            id: message.id,
        },
    });

    if (prismaMessage) {
        return prismaMessage;
    }

    // now, we make the message
    // if the author of the message did not exist before, we create it
    await getUser(message.author.id, prisma)
    return await prisma.message.create({
        data: {
            id: message.id,
            channelId: message.channelId,
            guildId: message.guildId,
            author: { connect: { id: message.author.id } },
            createdAt: message.createdAt,
        },
    });
}
