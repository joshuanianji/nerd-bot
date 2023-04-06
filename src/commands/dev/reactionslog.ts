
import { execa } from 'execa';
import { Config } from '../../config.js';
import { APIEmbedField, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import Client from '../../client.js';
import { getScoreNew } from '../../util/score.js';

export const reactionslog = async (client: Client, intr: ChatInputCommandInteraction): Promise<void> => {
    const count = intr.options.getInteger('count') ?? 10;
    await intr.reply('Fetching reactions...');

    const prismaData = await client.prisma.reactionNew.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        take: count,
        include: {
            message: true
        }
    });

    const reactionFields: APIEmbedField[] = await Promise.all(prismaData.map(async (data, i) => {
        const userA = await client.users.fetch(data.userId);
        const userB = await client.users.fetch(data.message.authorId);
        const scoreA = await getScoreNew(data.userId, client.prisma, data.createdAt);
        const scoreB = await getScoreNew(data.message.authorId, client.prisma, data.createdAt);
        return {
            name: `${i + 1}. ${userA.username} -🤓-> ${userB.username}`,
            value: `(${scoreA.toFixed(2)}, ${scoreB.toFixed(2)}) -> (${(scoreA + data.deltaA).toFixed(2)}, ${(scoreB + data.deltaB).toFixed(2)}) Δ(${data.deltaA.toFixed(2)}, ${data.deltaB.toFixed(2)})`
        }
    }));

    // send leaderboard in embed
    const embed = new EmbedBuilder()
        .setTitle('Reactions Log')
        .addFields(reactionFields)
        // add timer
        .setFooter({
            text: `Time taken: ${Date.now() - intr.createdTimestamp}ms`
        })

    await intr.editReply({ content: '', embeds: [embed] });
    return;
}