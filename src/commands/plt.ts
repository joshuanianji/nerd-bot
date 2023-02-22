import { Command } from '../types/command';
import si from 'systeminformation';
import { EmbedBuilder } from '@discordjs/builders';
import { upsertUser } from '../util/upsertUser';
import Client from './../client';
import { AttachmentBuilder, CommandInteraction } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { getScore } from '../util/getScore';
import { getScorePlot } from '../util/getScorePlot';

export const plt: Command = {
    name: 'plt',
    description: 'Plot your nerd score',
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
        const pltBuffer = await getScorePlot();
        const file = new AttachmentBuilder(pltBuffer, {
            name: `${user.id}-nerd-score.png`,
            description: `Nerd score plot for ${user.username}`,
        });

        intr.reply({ embeds: [embed], files: [file] });
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