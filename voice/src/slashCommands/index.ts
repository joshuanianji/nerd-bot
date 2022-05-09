import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Context } from '../interfaces/context';
import chalk from 'chalk';
import { ping } from './ping';
import { vc } from './vc';
import { SlashCommand } from '../interfaces/slashCommand';
import { CommandInteraction, Interaction } from 'discord.js';

// Interface for client.ts to register slash commands

// list of all slash commands
const commands: SlashCommand[] = [ping, vc];

// if we are in development mode, refresh commands guild-wide
// else, refresh commands globally
export const refreshCommands = async (ctx: Context) => {

    const commandsREST = commands.map(data => ({ 'name': data.name, 'description': data.description, 'options': data.options }));

    try {
        const rest = new REST({ version: '9' }).setToken(ctx.token);
        if (ctx.mode === 'development') {
            // refresh commands guild-wide
            console.log(`${chalk.blue('[INFO]')} Set Commands for ${chalk.bold('Development')} in GuildID ${ctx.guildID}:\n ${commands.map(c => c.name).join(', ')}`);
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

// actually runs a command
// used inside a interactionCreate subscription handler
// since it is a CommandInteraction, we need to make sure the interaction is actually a slash command
// https://discordjs.guide/interactions/slash-commands.html#receiving-interactions
export const runCommand = async (ctx: Context, interaction: CommandInteraction) => {
    const cmdToRun = commands.find(cmd => cmd.name === interaction.commandName);
    if (!cmdToRun) {
        await interaction.reply('Command not found!');
        return
    }

    await cmdToRun.run(ctx, interaction);
}