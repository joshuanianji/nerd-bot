import { Command } from '../types/command.js';

export const leaderboard: Command = {
    name: 'lb',
    description: 'Nerd Score Leaderboard',
    dm_permission: false,
    run: async (client, intr) => {
        await intr.reply('Leaderboard coming soon!')
        return;
    }
}