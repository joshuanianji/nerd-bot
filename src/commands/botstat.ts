import { Command } from '../types/command.js';
import { EmbedBuilder } from '@discordjs/builders';
import { Collection, OAuth2Guild } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import ExtendedClient from '../client.js';

export const botstat: Command = {
    name: 'botstat',
    description: 'Basic stats about the bot',
    dm_permission: false,
    run: async (client, intr) => {
        const embed = new EmbedBuilder().setTitle('botstat');

        const guilds = await client.guilds.fetch();
        addStats(embed, client);
        addGuilds(embed, guilds);

        intr.reply({ embeds: [embed] })
        return;
    }
}

const addStats = (embed: EmbedBuilder, client: ExtendedClient<true>) => {
    const uptime = client.uptime;
    const env = client.config.ENV;

    embed.addFields({
        name: `Basic Stats`,
        value: `**Uptime**: ${prettyMilliseconds(uptime)}\n**Environment**: ${env}`
    })
}


const addGuilds = (embed: EmbedBuilder, guilds: Collection<string, OAuth2Guild>) => {
    if (guilds.size > 5) {
        embed.addFields({
            name: `Currently in ${guilds.size} guild(s)`,
            value: `Top 5: ${guilds.map(g => g.name).slice(0, 5).join(', ')}`
        })
    } else {
        embed.addFields({
            name: `Currently in ${guilds.size} guilds`,
            value: guilds.map(g => g.name).join(', ')
        })
    }
}