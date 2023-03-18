import { Command } from '../types/command.js';
import { EmbedBuilder } from '@discordjs/builders';
import { AttachmentBuilder, ChatInputCommandInteraction, User } from 'discord.js';
import { Prisma } from '@prisma/client';
import { log } from '../util/log.js';
import Chart from 'chart.js';
import { dateFnsAdapter } from '../util/chartjsDateAdapter.js';
import { de } from 'date-fns/locale';
import { Canvas } from '../types/canvas.js';
import ExtendedClient from '../client.js';


export const plt: Command = {
    name: 'plt',
    description: 'Plot your nerd score',
    dm_permission: false,
    run: async (client, intr) => {
        const subcommand = intr.options.getSubcommand();
        if (subcommand === 'me') {
            return runSinglePlot(intr.user, client, intr);
        } else if (subcommand === 'user') {
            const user = intr.options.getUser('user')
            if (!user) {
                await intr.reply('Please specify a user!');
                return;
            }
            return runSinglePlot(user, client, intr);
        } else if (subcommand === 'diff') {
            await intr.reply('Not implemented yet!');
            return;
        } else {
            await intr.reply('Unknown subcommand!');
            return;
        }
    },
    // https://stackoverflow.com/a/71050529
    updateBuilder(builder) {
        builder
            .addSubcommand(subcommand => subcommand.setName('me').setDescription('Plot your nerd score'))
            .addSubcommand(subcommand =>
                subcommand.setName('user')
                    .setDescription('Plot the nerd score of a user')
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('The user to plot the nerd score of')
                            .setRequired(true)
                    ))
            .addSubcommand(subcommand =>
                subcommand.setName('diff')
                    .setDescription('Plot the difference between two users\' nerd scores')
                    .addUserOption(option =>
                        option.setName('user1')
                            .setDescription('The first user to plot the nerd score of')
                            .setRequired(true)
                    )
                    .addUserOption(option =>
                        option.setName('user2')
                            .setDescription('The second user to plot the nerd score of')
                            .setRequired(true)
                    ))
    },
}

// run a command that request a single plot for `userId`
const runSinglePlot = async (discordUser: User, client: ExtendedClient, intr: ChatInputCommandInteraction) => {
    if (discordUser.bot) {
        intr.reply(`Silly ${intr.user.toString()}, bots don't have nerd stats!`);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`${discordUser.username}' nerd stats`);

    if (discordUser.id !== intr.user.id) {
        embed.setDescription(`Requested by ${intr.user.toString()}`);
    }

    // check if the user has participated yet (they have a record in the database)
    const active = await client.prisma.user.findFirst({
        where: { id: discordUser.id },
    });
    if (!active) {
        embed.setDescription(`No nerd stats for ${discordUser.username} yet!`);
        intr.reply({ embeds: [embed] });
        return;
    }

    // first, get user (or create an empty one if they haven't participated yet)
    // the process of setting an image created via an attachmentBuilder on an embed is kinda weird...
    try {
        const pltBuffer = await getScorePlotSingle(discordUser.id, client.prisma, client.canvas);
        if (!pltBuffer) {
            // user has no nerd stats yet
            embed.setDescription(`No nerd stats for ${discordUser.username} yet!`);
            intr.reply({ embeds: [embed] });
            return;
        }
        const file = new AttachmentBuilder(pltBuffer, {
            name: `${discordUser.id}-nerd-score.png`,
            description: `Nerd score plot for ${discordUser.username}`,
        });
        embed.setImage(`attachment://${discordUser.id}-nerd-score.png`);
        intr.reply({ embeds: [embed], files: [file] });
    } catch (error) {
        console.log(error)
        embed.setDescription(`Error generating nerd score plot for ${discordUser.username}!`);
        intr.reply({ embeds: [embed] });
        return;
    }
}

// returns a buffer containing a PNG image of an individual user's nerd plot
// if the user has no nerd stats yet, returns null
const getScorePlotSingle = async <P extends Prisma.TransactionClient>(userId: string, prisma: P, canvas: Canvas): Promise<Buffer | null> => {
    // HACK HACK HACK HACK HACK
    // https://github.com/chartjs/chartjs-adapter-date-fns/issues/58
    // also, importing `chartjs-adapter-date-fns` as intended gives us an error:
    // `The requested module 'chart.js' does not provide an export named '_adapters'`
    Chart._adapters._date.override(dateFnsAdapter);

    // this code is kinda messy, but the first part emulates the getScore function
    // we get all the reactions sent and received, and we just want to put them in one big array, sorted by date
    // then, we can reduce over the entire array in one sweep, creating a cumulative sum of the scores over time
    const reactionsSent = await prisma.reaction.findMany({
        where: { user: { id: userId } }
    });
    const sentGeneral = reactionsSent.map(r => ({ type: 'additive' as const, reaction: r }))

    // reactionsReceived are all reactions on a message where the user is the author
    const reactionsReceived = await prisma.reaction.findMany({
        where: { message: { author: { id: userId } } }
    });
    const receivedGeneral = reactionsReceived.map(r => ({ type: 'subtractive' as const, reaction: r }))

    // all reactions are sorted in ascending order of time
    const reactions = [...sentGeneral, ...receivedGeneral];
    reactions.sort((a, b) => a.reaction.createdAt.getTime() - b.reaction.createdAt.getTime());

    if (reactions.length === 0) {
        // the user is registered in the User table, but has no reactions
        return null;
    }

    // now, I want to initialize the `data` array with an "initial" point of 1000
    // To make it actually visible, I'll set it to appear before the first point on the graph, 1/25th of the total time away
    const firstReaction = reactions[0].reaction.createdAt.getTime();
    const lastReaction = reactions[reactions.length - 1].reaction.createdAt.getTime();
    // subtracting 1 second in the case that the user only has one reaction
    const initialTime = new Date(firstReaction - (lastReaction - firstReaction) / 25 - 1000);

    // here, we finally collect the data
    const data = [{ y: 1000, x: initialTime.getTime() }];
    let score = 1000;
    for (const { type, reaction } of reactions) {
        if (type === 'additive') {
            score += reaction.weight;
        } else {
            score -= reaction.weight;
        }
        data.push({ y: score, x: reaction.createdAt.getTime() });
    }

    // example line chart
    const configuration: Chart.ChartConfiguration = {
        type: 'line',
        data: {
            datasets: [{
                data: data,
                backgroundColor: '#000',
                borderColor: '#000',
                label: 'Nerd score',
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            millisecond: 'mm:ss.SSS',
                            second: 'HH:mm:ss',
                            minute: 'HH:mm',
                            hour: 'mm/dd HH:mm',
                            day: 'MM/dd',
                            week: 'yyyy/MM/dd',
                            month: 'yyyy/MM',
                            quarter: 'yyyy/MM',
                            year: 'yyyy'
                        }
                    },
                    adapters: {
                        date: de
                    }
                }
            }
        },
        plugins: [{
            id: 'background-colour',
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }
        }]
    };
    return canvas.chartJSNodeCanvas.renderToBuffer(configuration);
}