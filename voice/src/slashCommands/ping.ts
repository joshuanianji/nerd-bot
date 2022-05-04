import { SlashCommand } from '../interfaces/slashCommand';

export const ping: SlashCommand = {
    name: 'ping',
    description: 'Replies with Pong',
    run: async (ctx, interaction) => {
        await interaction.reply('Pong!');
    }
}
