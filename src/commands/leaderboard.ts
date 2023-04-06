import { EmbedBuilder } from '@discordjs/builders';
import { Command } from '../types/command.js';
import { getScore, getScoreNew } from '../util/score.js';

export const leaderboard: Command = {
    name: 'leaderboard',
    description: 'Nerd Score Leaderboard',
    dm_permission: false,
    run: async (client, intr) => {
        await intr.reply('Fetching leaderboard...');
        // should we really just loop through each user? that's very wasteful...
        // maybe we should have a separate table for this. But how do we keep it updated?
        // since my database is so small, i think the naive approach is fine for now

        const getBottom = intr.options.getBoolean('bottom', false) || false;

        const users = await client.prisma.user.findMany();
        const scores = await Promise.all(users.map(async u => {
            const score = await getScoreNew(u.id, client.prisma)
            return { id: u.id, score }
        }));
        // sort by score (ascending or descending depends on whether we're getting top 10 or bottom 10), and take the first 10
        scores.sort((a, b) => getBottom ? a.score - b.score : b.score - a.score);
        const first10 = scores.slice(0, 10);

        // then, add the usernames
        // a discord client caches a mapping of ID to users via the user manager
        // https://discord.js.org/#/docs/discord.js/main/class/Client?scrollTo=users
        // from my experience, this is pretty slow to query when we have cache misses
        // so, I only query users for the top 10 to save on API calls and increase my cache hit ratio
        let cacheHits = 0;
        const first10Users = await Promise.all(first10.map(async ({ id, score }) => {
            if (client.users.cache.has(id)) {
                cacheHits++;
            }
            const discordUser = await client.users.fetch(id);
            return { discordUser, score }
        }))

        // send leaderboard in embed
        const embed = new EmbedBuilder()
            .setTitle('Leaderboard')
            .addFields({
                name: `${getBottom ? 'Bottom' : 'Top'} 10 Nerd Scores`,
                value: first10Users.map(({ discordUser, score }, i) => `${i + 1}. ${discordUser.username} - \`${score}\``).join('\n')
            })
            .setFooter({
                text: `${cacheHits} cache hits, ${first10Users.length - cacheHits} API calls`
            })
        await intr.editReply({ content: '', embeds: [embed] });
        return;
    },
    updateBuilder(builder) {
        builder
            .addBooleanOption(option =>
                option.setName('bottom')
                    .setDescription('Show the bottom 10 scores instead of the top 10')
                    .setRequired(false)
            )
    }
}