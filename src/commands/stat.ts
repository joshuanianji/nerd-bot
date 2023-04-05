import { Command } from '../types/command.js';
import { EmbedBuilder } from '@discordjs/builders';
import { upsertUser } from '../util/upsertUser.js';
import { PrismaClient } from '@prisma/client';
import { getScore } from '../util/score.js';

export const stat: Command = {
    name: 'stat',
    description: 'Your nerd stats, or someone else\'s nerd stats',
    dm_permission: false,
    run: async (client, intr) => {
        const user = intr.options.getUser('user') || intr.user;

        if (user.bot) {
            intr.reply(`Silly ${intr.user.toString()}, bots don't have nerd stats!`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${user.username}' nerd stats`);

        if (user.id !== intr.user.id) {
            embed.setDescription(`Requested by ${intr.user.toString()}`);
        }

        // first, get user (or create an empty one if they haven't participated yet)
        await upsertUser(user.id, client.prisma);
        await addUserStats(embed, user.id, client.prisma);
        await addMessages(embed, user.id, client.prisma);
        await addReactions(embed, user.id, client.prisma);

        intr.reply({ embeds: [embed] });
        return;
    },
    // https://stackoverflow.com/a/71050529
    updateBuilder(builder) {
        builder.addUserOption(option => option
            .setName('user')
            .setDescription('The user to get nerd stats for')
            .setRequired(false));
    },
}

const addUserStats = async (embed: EmbedBuilder, userId: string, prisma: PrismaClient) => {
    // get score 
    const score = await getScore(userId, prisma);
    embed.addFields({
        name: 'Stats',
        value: `**Score**: ${score}`
    });
}

const addMessages = async (embed: EmbedBuilder, userId: string, prisma: PrismaClient) => {
    // all the messages sent by the user (empty if new user)
    // make sure messages have at least one reaction relation
    // For example, if a user unreacts to a message, the message will still be in the database
    const [messages, messagesPast24h] = await prisma.$transaction([
        // total amount of reactions on the user's messages
        prisma.reaction.count({
            where: {
                message: { authorId: userId },
            }
        }),
        prisma.reaction.count({
            where: {
                message: { authorId: userId },
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }
        })
    ]);

    embed.addFields({
        name: 'Nerd reactions received',
        value: `**Total**: ${messages},\n**Past 24h**: ${messagesPast24h}`
    });
}

const addReactions = async (embed: EmbedBuilder, userId: string, prisma: PrismaClient) => {
    // all the nerd reactions sent by the user
    const [reactions, reactionsPast24h] = await prisma.$transaction([
        prisma.reaction.count({ where: { userId: userId } }),
        prisma.reaction.count({
            where: {
                userId: userId,
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        })
    ]);

    embed.addFields({
        name: 'Nerd Reactions Given',
        value: `**Total**: ${reactions},\n**Past 24h**: ${reactionsPast24h}`
    });
}
