
// joins the vc of the user that sent the command
// if anyone speaks

import { SlashCommand } from '../interfaces/slashCommand';

export const vc: SlashCommand = {
    name: 'vc',
    description: 'Joins VC stuff',
    run: async (ctx, interaction) => {
        if (!interaction.inCachedGuild()) {
            await interaction.reply('You need to be in a guild!');
            return;
        }
        // the interaction needs to be cached AND in a build for `.member` to be a GuildMember
        // GuildMember has the vc info we want.
        const vcChannel = interaction.member.voice.channel;
        if (!vcChannel) {
            await interaction.reply('You need to be in a voice channel!');
            return;
        }
        await interaction.reply(`Currently in channel ${vcChannel.toString()}`);
    }
}
