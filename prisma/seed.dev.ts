
// seed the database with some test data

import { PrismaClient } from '@prisma/client'
import { addNerdReaction } from '../src/util/collectNerdReaction'
import { KindofDiscordMessage } from '../src/util/upsertMessage';

const prisma = new PrismaClient()
async function main() {
    if (process.env.NODE_ENV !== 'development') {
        console.error(`Skipping seed, not in development environment (NODE_ENV=${process.env.NODE_ENV})`);
        return;
    }

    const me_id = '240645351705542658';
    const other_id = '256212924723363844';
    const today = new Date();
    const dayInMillis = 1000 * 60 * 60 * 24;

    // create 10 reactions from me_id to messages from other_id, and vice versa
    // copilot is a life saver for these things
    // userId: user who created the reaction
    // msgAuthorId: user who authored the message
    const REACTIONS = [
        { userId: me_id, messageId: '1', msgAuthorId: other_id, createdAt: new Date(today.getTime() - dayInMillis * 7) },
        { userId: me_id, messageId: '2', msgAuthorId: other_id, createdAt: new Date(today.getTime() - dayInMillis * 6) },
        { userId: me_id, messageId: '3', msgAuthorId: other_id, createdAt: new Date(today.getTime() - dayInMillis * 5) },
        { userId: me_id, messageId: '4', msgAuthorId: other_id, createdAt: new Date(today.getTime() - dayInMillis * 4) },
        { userId: me_id, messageId: '5', msgAuthorId: other_id, createdAt: new Date(today.getTime() - dayInMillis * 3) },
        { userId: me_id, messageId: '6', msgAuthorId: other_id, createdAt: new Date(today.getTime() - dayInMillis * 2) },
        { userId: me_id, messageId: '7', msgAuthorId: other_id, createdAt: new Date(today.getTime() - dayInMillis * 1) },
        { userId: me_id, messageId: '8', msgAuthorId: other_id, createdAt: new Date(today.getTime() - dayInMillis * 0) },
        { userId: me_id, messageId: '9', msgAuthorId: other_id, createdAt: new Date(today.getTime() - dayInMillis * 0.5) },
        { userId: me_id, messageId: '10', msgAuthorId: other_id, createdAt: new Date(today.getTime() - dayInMillis * 0.25) },
        { userId: other_id, messageId: '11', msgAuthorId: me_id, createdAt: new Date(today.getTime() - dayInMillis * 7 - 2000) },
        { userId: other_id, messageId: '12', msgAuthorId: me_id, createdAt: new Date(today.getTime() - dayInMillis * 6 - 2000) },
        { userId: other_id, messageId: '13', msgAuthorId: me_id, createdAt: new Date(today.getTime() - dayInMillis * 5 - 2000) },
        { userId: other_id, messageId: '14', msgAuthorId: me_id, createdAt: new Date(today.getTime() - dayInMillis * 4 - 2000) },
        { userId: other_id, messageId: '15', msgAuthorId: me_id, createdAt: new Date(today.getTime() - dayInMillis * 3 - 2000) },
        { userId: other_id, messageId: '16', msgAuthorId: me_id, createdAt: new Date(today.getTime() - dayInMillis * 2 - 2000) },
        { userId: other_id, messageId: '17', msgAuthorId: me_id, createdAt: new Date(today.getTime() - dayInMillis * 1 - 2000) },
        { userId: other_id, messageId: '18', msgAuthorId: me_id, createdAt: new Date(today.getTime() - dayInMillis * 0 - 2000) },
        { userId: other_id, messageId: '19', msgAuthorId: me_id, createdAt: new Date(today.getTime() - dayInMillis * 0.5 - 2000) },
        { userId: other_id, messageId: '20', msgAuthorId: me_id, createdAt: new Date(today.getTime() - dayInMillis * 0.25 - 2000) },
    ]
    // sort by ascending order of createdAt
    REACTIONS.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    console.log('Adding reactions:')
    for (const { userId, msgAuthorId, createdAt } of REACTIONS) {
        console.log(`${userId} reacted to ${msgAuthorId} at ${createdAt}`)
    }

    // create users `me` and `other`
    const me = await prisma.user.upsert({
        where: { id: me_id },
        update: {},
        create: {
            id: me_id,
            openedHelp: false
        },
    })

    const other = await prisma.user.upsert({
        where: { id: other_id },
        update: {},
        create: {
            id: other_id,
            openedHelp: false
        },
    })


    // now, iterate over REACTIONS and run the addNerdReaction function
    for (const reaction of REACTIONS) {
        try {
            const kindofMsg: KindofDiscordMessage = {
                id: reaction.messageId,
                author: {
                    id: reaction.msgAuthorId
                },
                channelId: '1',
                guildId: '1',
                // note the createdAt is the same as the reaction createdAt for now
                // this is fine since we're only handling one reaction per message (and assuming it's the first)
                createdAt: reaction.createdAt
            }
            await addNerdReaction(reaction.userId, kindofMsg, prisma);
        } catch (e) {
            console.error(`Error adding nerd reaction: ${reaction}`);
        }
    }

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

