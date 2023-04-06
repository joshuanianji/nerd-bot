// manually migrating the old data to the new schema
// assumes current datavbase is loaded with the prod data

import { PrismaClient } from '@prisma/client';
import { addNerdReactionNew } from '../src/util/collectNerdReaction';
import { KindofDiscordMessage } from '../src/util/upsertMessage';
import { execa } from 'execa';
import dotenv from 'dotenv';

const prisma = new PrismaClient()

// delete all data from prisma.reactionNew
await prisma.reactionNew.deleteMany({});

const reactions = await prisma.reaction.findMany({
    orderBy: {
        createdAt: 'asc'
    }
});

console.log(reactions[0]);
console.log(reactions[reactions.length - 1]);

for (const reaction of reactions) {
    // make a new reaction
    const prismaMsg = await prisma.message.findUnique({ where: { id: reaction.messageId } });
    if (!prismaMsg) {
        console.log(`Message ${reaction.messageId} not found`);
        continue;
    }

    const msg: KindofDiscordMessage = {
        author: {
            id: prismaMsg.authorId
        },
        ...prismaMsg
    };
    await addNerdReactionNew(reaction.userId, msg, prisma)
}

await prisma.$disconnect();
