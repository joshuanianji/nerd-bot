import { Command } from '../types/command.js';
import { EmbedBuilder } from '@discordjs/builders';
import { AttachmentBuilder } from 'discord.js';
import { getScorePlot } from '../util/getScorePlot.js';

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

        // check if the user has participated yet (they have a record in the database)
        const active = await client.prisma.user.findFirst({
            where: { id: user.id },
        });
        if (!active) {
            embed.setDescription(`No nerd stats for ${user.username} yet!`);
            intr.reply({ embeds: [embed] });
            return;
        }

        // first, get user (or create an empty one if they haven't participated yet)
        // the process of setting an image created via an attachmentBuilder on an embed is kinda weird...
        try {
            const pltBuffer = await getScorePlot(user.id, client.prisma, client.chartJsNodeCanvas);
            const file = new AttachmentBuilder(pltBuffer, {
                name: `${user.id}-nerd-score.png`,
                description: `Nerd score plot for ${user.username}`,
            });
            embed.setImage(`attachment://${user.id}-nerd-score.png`);
            intr.reply({ embeds: [embed], files: [file] });
        } catch (error) {
            console.log(error)
            embed.setDescription(`Error generating nerd score plot for ${user.username}!`);
            intr.reply({ embeds: [embed] });
            return;
        }
    },
    // https://stackoverflow.com/a/71050529
    updateBuilder(builder) {
        builder.addUserOption(option => option
            .setName('user')
            .setDescription('The user to get nerd stats for')
            .setRequired(false));
    },
}