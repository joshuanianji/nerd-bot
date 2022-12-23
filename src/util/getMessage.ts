import { PrismaClient } from '@prisma/client';
import { Message } from 'discord.js';
import { Message as PrismaMessage } from '@prisma/client';

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

    // assume author of the message exists in the database
    return await prisma.message.create({
        data: {
            id: message.id,
            channelId: message.channelId,
            guildId: message.guildId,
            author: { connect: { id: message.author.id } },
        },
    });
}
