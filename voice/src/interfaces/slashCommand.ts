import { ApplicationCommandOptionData, CommandInteraction } from 'discord.js';
import { Context } from './context';

// slash command data, which is then consumed by slashCommands/index.ts

type Run = (ctx: Context, interaction: CommandInteraction) => Promise<void>;

export interface SlashCommand {
    name: string;
    description: string;
    devOnly?: boolean;
    options?: ApplicationCommandOptionData[];
    run: Run;
}
