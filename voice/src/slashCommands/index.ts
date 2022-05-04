import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Context } from '../interfaces/context';
import chalk from 'chalk';
import { ping } from './ping';
import { SlashCommand } from '../interfaces/slashCommand';

// Interface for client.ts to register slash commands

// list of all slash commands
const commands: SlashCommand[] = [ping];

export const refreshCommands = async (ctx: Context) => {

    const commandsREST = commands.map(data => ({ 'name': data.name, 'description': data.description, 'options': data.options }));

    try {
        const rest = new REST({ version: '9' }).setToken(ctx.token);
        if (ctx.mode === 'development') {
            // refresh commands guild-wise

            console.log(`${chalk.blue('[INFO]')} Set Commands for ${chalk.bold('Development')}:\n ${commands.map(c => c.name).join(', ')}`);
            await rest.put(Routes.applicationGuildCommands(ctx.appID, ctx.guildID), { body: commandsREST })
        } else if (ctx.mode === 'production') {
            // refresh commands globally
            console.log(`${chalk.blue('[INFO]')} Set Commands for ${chalk.bold('Production')}:\n ${commands.map(c => c.name).join(', ')}`);
            await rest.put(
                Routes.applicationCommands(ctx.appID),
                { body: commandsREST },
            );
        }
        console.log(`${chalk.green('[INFO]')} Sucessfully reloaded application (/) commands.`);
    } catch (err) {
        console.log(`${chalk.red('[ERROR]')} There was an error registering a slash command:\n${err}`);
    }
}
