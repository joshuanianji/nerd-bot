import { getVoiceConnection } from '@discordjs/voice';
import { CommandInteraction } from 'discord.js';

/**
 * Leaves whatever VC the bot is currently joined in
 * 
 * @param intr Command interaction from a cached guild
 */
export const leave = async (intr: CommandInteraction<'cached'>): Promise<void> => {
    const connection = getVoiceConnection(intr.guildId);
    if (!connection) {
        return intr.reply('Not in a vc!');
    }

    connection.destroy();
    return intr.reply(`Left vc!`);
}