import { Command } from '../types/command';
import si from 'systeminformation';
import { EmbedBuilder } from '@discordjs/builders';
import { getUser } from '../util/getUser';
import Client from './../client';
import { CommandInteraction } from 'discord.js';

export const stat: Command = {
    name: 'stat',
    description: 'Your nerd stats',
    dm_permission: false,
    run: async (client, intr) => {
        const embed = new EmbedBuilder()
            .setTitle(`${intr.user.tag}'s Nerd Stats`);

        // first, get user (or create an empty one if they haven't participated yet)
        const user = await getUser(intr.user.id, client.prisma);
        // TODO: add a "hello" if it's their first time

        await addMessages(embed, client, intr);
        await addReactions(embed, client, intr);

        intr.reply({ embeds: [embed] });
        return;
    }
}

const addMessages = async (embed: EmbedBuilder, client: Client, intr: CommandInteraction) => {
    // all the messages sent by the user that got nerd reacted (empty if new user)
    const messages = await client.prisma.message.count({
        where: { authorId: intr.user.id }
    });

    const messagesPast24h = await client.prisma.message.count({
        where: {
            authorId: intr.user.id,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
    });

    embed.addFields({
        name: 'Messages that got Nerd Reacted',
        value: `**Total**: ${messages},\n**Past 24h**: ${messagesPast24h}`
    });
}

const addReactions = async (embed: EmbedBuilder, client: Client, intr: CommandInteraction) => {
    // all the messages sent by the user that got nerd reacted (empty if new user)
    const messages = await client.prisma.reaction.count({
        where: { userId: intr.user.id }
    });

    const messagesPast24h = await client.prisma.reaction.count({
        where: {
            userId: intr.user.id,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
    });

    embed.addFields({
        name: 'Nerd Reactions Given',
        value: `**Total**: ${messages},\n**Past 24h**: ${messagesPast24h}`
    });
}
