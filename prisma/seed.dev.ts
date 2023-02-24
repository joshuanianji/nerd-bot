
// seed the database with some test data

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    if (process.env.NODE_ENV !== 'development') {
        console.error('Skipping seed, not in development environment');
    }

    const me_id = '240645351705542658';
    const other_id = '256212924723363844';
    const today = new Date();
    const dayInMillis = 1000 * 60 * 60 * 24;

    const me = await prisma.user.upsert({
        where: { id: me_id },
        update: {},
        create: {
            id: me_id,
            openedHelp: false
        },
    })
    // create 5 messages from me_id over the course of a week
    await prisma.message.createMany({
        skipDuplicates: true,
        data: [
            {
                id: '1',
                authorId: me_id,
                channelId: '1',
                guildId: '1',
                reactionCounter: 1,
                createdAt: today
            },
            {
                id: '3',
                authorId: me_id,
                channelId: '1',
                guildId: '1',
                reactionCounter: 1,
                createdAt: new Date(today.getTime() - dayInMillis)
            },
            {
                id: '4',
                authorId: me_id,
                channelId: '1',
                guildId: '1',
                reactionCounter: 1,
                createdAt: new Date(today.getTime() - dayInMillis * 2)
            },
            {
                id: '5',
                authorId: me_id,
                channelId: '1',
                guildId: '1',
                reactionCounter: 1,
                createdAt: new Date(today.getTime() - dayInMillis * 3)
            },
            {
                id: '6',
                authorId: me_id,
                channelId: '1',
                guildId: '1',
                reactionCounter: 1,
                createdAt: new Date(today.getTime() - dayInMillis * 4)
            },
            {
                id: '7',
                authorId: me_id,
                channelId: '1',
                guildId: '1',
                reactionCounter: 1,
                createdAt: new Date(today.getTime() - dayInMillis * 5)
            },
            {
                id: '8',
                authorId: me_id,
                channelId: '1',
                guildId: '1',
                reactionCounter: 1,
                createdAt: new Date(today.getTime() - dayInMillis * 6)
            },
        ]
    })

    const other = await prisma.user.upsert({
        where: { id: other_id },
        update: {},
        create: {
            id: other_id,
            openedHelp: false
        },
    })

    // create messages from other
    await prisma.message.createMany({
        skipDuplicates: true,
        data: [
            {
                id: '2',
                authorId: other_id,
                channelId: '1',
                guildId: '1',
                reactionCounter: 1,
                createdAt: new Date(),
            },
            {
                id: '9',
                authorId: other_id,
                channelId: '1',
                guildId: '1',
                reactionCounter: 1,
                createdAt: new Date(today.getTime() - dayInMillis * 5),
            }
        ]
    })

    // make me react to other
    await prisma.reaction.createMany({
        skipDuplicates: true,
        data: [
            { userId: me_id, messageId: '1', position: 1, weight: 100, },
            { userId: me_id, messageId: '9', position: 1, weight: 100, },
        ]
    })

    // let other react to me
    await prisma.reaction.createMany({
        skipDuplicates: true,
        data: [
            { userId: other_id, messageId: '1', position: 1, weight: 100 },
            { userId: other_id, messageId: '3', position: 1, weight: 100 },
            { userId: other_id, messageId: '4', position: 1, weight: 100 },
            { userId: other_id, messageId: '5', position: 1, weight: 100 },
            { userId: other_id, messageId: '6', position: 1, weight: 100 },
            { userId: other_id, messageId: '7', position: 1, weight: 100 },
            { userId: other_id, messageId: '8', position: 1, weight: 100 }
        ]
    })
    console.log({ me, other })
}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

