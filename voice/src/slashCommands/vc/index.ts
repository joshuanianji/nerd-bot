
// joins the vc of the user that sent the command
// if anyone speaks


import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { SlashCommand } from '../../interfaces/slashCommand';
import { join } from './join';
import { leave } from './leave';

export const vc: SlashCommand = {
    name: 'vc',
    description: 'VC stuff',
    options: [
        {
            description: "Joins VC",
            name: "join",
            type: ApplicationCommandOptionTypes.SUB_COMMAND
        },
        {
            description: "Leaves current VC",
            name: "leave",
            type: ApplicationCommandOptionTypes.SUB_COMMAND
        }
    ],
    run: async (ctx, intr) => {
        if (!intr.inCachedGuild()) {
            return intr.reply('You need to be in a guild!');
        }

        switch (intr.options.getSubcommand()) {
            case 'join': {
                return join(ctx, intr);
            }

            case 'leave': {
                return leave(intr);
            }

            default: {
                return intr.reply({ content: 'There was an error when executing the command!', ephemeral: true });
            }
        }
    }
}
