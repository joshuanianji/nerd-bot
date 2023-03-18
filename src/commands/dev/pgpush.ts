
import { Config } from '../../config.js';
import { ChatInputCommandInteraction } from 'discord.js';

export const pgpush = async (config: Config, intr: ChatInputCommandInteraction): Promise<void> => {
    intr.reply('hi')
    return;
}

