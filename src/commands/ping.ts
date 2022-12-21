import { Command } from '../types/command';

export const ping: Command = {
    name: 'ping',
    description: 'Replies with pong',
    run: async (_, intr) => {
        await intr.reply('Pong!');
        return;
    }
}
