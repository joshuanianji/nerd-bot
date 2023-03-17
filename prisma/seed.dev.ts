
// seed the database with some test data

import { PrismaClient } from '@prisma/client';
import { addNerdReaction } from '../src/util/collectNerdReaction';
import { KindofDiscordMessage } from '../src/util/upsertMessage';
import { execa } from 'execa';
import dotenv from 'dotenv';

const prisma = new PrismaClient()

async function main() {
    // read env variables
    dotenv.config();

    if (process.env.ENV !== 'dev') {
        console.error(`Skipping seed, not in development environment (ENV=${process.env.ENV})`);
        return;
    }

    const args = process.argv;

    const me_id = '240645351705542658';
    const other_id = '256212924723363844';

    if (args.includes('prod')) {
        // prod does not use prisma, but psql and the `prod.sql` file 
        // so we use a different logic
        console.log('Seeding prod database...')

        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            console.error('DATABASE_URL not set, aborting');
            return;
        }

        console.log(`Seeding '${dbUrl}' with prod.sql...`)
        // psql --dbname=postgres://user:pass@host:port/dbname ./prisma/prod.sql
        const output = await execa('psql', [`--dbname=${dbUrl}`, '-f', './prisma/prod.sql']);
        console.log(output.command)
        if (output.exitCode !== 0) {
            console.error(`Error seeding prod database! Error: ${output.exitCode}`);
            console.log(output.stdout);
            console.log(output.stderr);
        } else {
            console.log('Done!')
            console.log(output.stdout);
        }
        return;
    }

    // create 10 reactions from me_id to messages from other_id, and vice versa
    // copilot is a life saver for these things. Maybe I should have been more dry though?
    // userId: user who created the reaction
    // msgAuthorId: user who authored the message
    const REACTIONS = await createReactions(me_id, other_id, args);
    // sort by ascending order of createdAt
    REACTIONS.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // create users `me` and `other` (if we're not seeding a null db)
    if (!args.includes('null')) {
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

        console.log(`Created users: ${me.id}, ${other.id}`)
    }

    // now, iterate over REACTIONS and run the addNerdReaction function
    console.log(`Adding ${REACTIONS.length} reactions...`)
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
            throw e;
        }
    }

    console.log('Done!')
}

// create reactions based on the argument
async function createReactions(me_id: string, other_id: string, args: string[]) {
    const today = new Date();
    const dayInMillis = 1000 * 60 * 60 * 24;

    const arg = args.length < 3 ? undefined : args[2];
    if (args.length < 3) {
        console.log('No argument provided, using default argument')
    } else {
        console.log(`Using argument ${arg}`)
    }

    if (!arg) {
        return [
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
    }

    if (arg === 'basic') {
        return [
            { userId: me_id, messageId: '1', msgAuthorId: other_id, createdAt: today },
        ]
    }

    if (arg === 'null') {
        return []
    }

    throw new Error(`Unknown argument ${arg}`)
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

