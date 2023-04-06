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
import * as result from '../types/result.js';
import { ChartDataset } from 'chart.js';


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
        } else if (subcommand === 'two') {
            const user1 = intr.options.getUser('user1');
            const user2 = intr.options.getUser('user2');

            if (!user1 || !user2) {
                await intr.reply('Please specify two users!');
                return;
            }

            if (user1.id == user2.id) {
                await intr.reply('Please specify two different users!');
                return;
            }

            return runDiffPlot(user1, user2, client, intr);
        } else {
            await intr.reply(`Unknown subcommand ${subcommand}!`);
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
                subcommand.setName('two')
                    .setDescription('Plot two users\' nerd scores')
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
        const { buffer, errs } = await getPlotScores([discordUser], client.prisma, client.canvas);
        if (!buffer) {
            // render error (very crudely)
            embed.setDescription(errs.join('\n'));
            intr.reply({ embeds: [embed] });
            return;
        }
        const file = new AttachmentBuilder(buffer, {
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

// runs a command that requests a diff plot 
const runDiffPlot = async (user1: User, user2: User, client: ExtendedClient, intr: ChatInputCommandInteraction) => {
    if (user1.bot || user2.bot) {
        intr.reply(`Please use real users!`);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`Nerd Plot Diff: ${user1.username} and ${user2.username}`)
        .setDescription(`Requested by ${intr.user.toString()}`);

    try {
        const { buffer, errs } = await getPlotScores([user1, user2], client.prisma, client.canvas);
        const files = [];
        if (buffer) {
            const fileName = `${user1.id}-${user2.id}-diff.png`;
            const file = new AttachmentBuilder(buffer, {
                name: fileName,
                description: `Nerd score diff for ${user1.username} and ${user2.username}`,
            });
            embed.setImage(`attachment://${fileName}`);
            files.push(file);
        }
        // add errors 
        if (errs.length > 0) {
            // render error (very crudely)
            embed.setFields({ name: 'Error logs', value: errs.join('\n') });
        }
        intr.reply({ embeds: [embed], files: files });
    } catch (error) {
        console.log(error)
        embed.setDescription(`Error generating plot diff for ${user1.username} and ${user2.username}!`);
        intr.reply({ embeds: [embed] });
        return;
    }
}

/*
 returns a buffer containing a PNG image of a the nerd plots for a list of users

 If at least one of the users has nerd stats, create the plot and return it
 Also, keep a list of the users who dont have nerd stats yet (we'll provide this as a "warning")
 */
const getPlotScores = async <P extends Prisma.TransactionClient>(
    users: User[],
    prisma: P,
    canvas: Canvas
): Promise<{
    buffer: Buffer | null,
    errs: string[]
}> => {
    // HACK HACK HACK HACK HACK
    // https://github.com/chartjs/chartjs-adapter-date-fns/issues/58
    // also, importing `chartjs-adapter-date-fns` as intended gives us an error:
    // `The requested module 'chart.js' does not provide an export named '_adapters'`
    Chart._adapters._date.override(dateFnsAdapter);

    const dataPromises = users.map(user => getUserDataPoints(user, prisma));
    const results = await Promise.all(dataPromises);
    const [datas, errs] = result.unzip(results)

    if (datas.length === 0) {
        return { buffer: null, errs: ['None of the users have nerd scores yet!'] }
    }

    // list of colours to rotate
    const colours = ['#000', 'red', 'green']
    const datasets = datas.map(([data, user], i) => {
        // hardcoding that we're plotting a line chart for easier intellisense
        // is this bad design? i'm genuinely not sure...
        const dataset: ChartDataset<'line'> = {
            data: data,
            backgroundColor: colours[i % colours.length],
            borderColor: colours[i % colours.length],
            borderWidth: 2,
            pointRadius: 0
        }

        // don't show label if there's only one user
        if (users.length > 1) {
            dataset.label = `${user.username}`;
        }
        return dataset;
    })

    // example line chart
    const configuration: Chart.ChartConfiguration = {
        type: 'line',
        data: { datasets },
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
            },
            plugins: {
                legend: {
                    display: users.length > 1
                }
            },
            layout: {
                padding: {
                    right: 8
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
    const buffer = await canvas.chartJSNodeCanvas.renderToBuffer(configuration);
    return { buffer, errs };
}

type DataPoint = { x: number, y: number };

// get the data points for the nerd plot, for a single user
const getUserDataPoints = async <P extends Prisma.TransactionClient>(user: User, prisma: P): Promise<result.Result<[DataPoint[], User], string>> => {
    // this code is kinda messy, but the first part emulates the getScore function
    // we get all the reactions sent and received, and we just want to put them in one big array, sorted by date
    // then, we can reduce over the entire array in one sweep, creating a cumulative sum of the scores over time
    const reactionsSent = await prisma.reaction.findMany({
        where: { user: { id: user.id } }
    });
    const sentGeneral = reactionsSent.map(r => ({ type: 'sent' as const, reaction: r }))

    // reactionsReceived are all reactions on a message where the user is the author
    const reactionsReceived = await prisma.reaction.findMany({
        where: { message: { author: { id: user.id } } }
    });
    const receivedGeneral = reactionsReceived.map(r => ({ type: 'received' as const, reaction: r }))

    // all reactions are sorted in ascending order of time
    const reactions = [...sentGeneral, ...receivedGeneral];
    reactions.sort((a, b) => a.reaction.createdAt.getTime() - b.reaction.createdAt.getTime());

    if (reactions.length === 0) {
        // the user is registered in the User table, but has no reactions
        return result.err(`${user.username} has no reactions`)
    }

    // now, I want to initialize the `data` array with an "initial" point of 1000
    // To make it actually visible, I'll set it to appear before the first point on the graph, 1/25th of the total time away
    const firstReaction = reactions[0].reaction.createdAt.getTime();
    const lastReaction = reactions[reactions.length - 1].reaction.createdAt.getTime();
    // subtracting 1 second in the case that the user only has one reaction
    const initialTime = new Date(firstReaction - (lastReaction - firstReaction) / 25 - 1000);

    // here, we finally collect the data
    const data: DataPoint[] = [{ y: 1000, x: initialTime.getTime() }];
    let score = 1000;
    for (const { type, reaction } of reactions) {
        if (type === 'sent') {
            score += reaction.deltaA;
        } else {
            score += reaction.deltaB;
        }
        data.push({ y: score, x: reaction.createdAt.getTime() });
    }

    // finally, push today's score to the end of the array
    const today = new Date();
    data.push({ y: score, x: today.getTime() });

    return result.ok([data, user]);
}