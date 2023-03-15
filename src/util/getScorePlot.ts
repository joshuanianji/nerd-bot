import { Prisma } from '@prisma/client';
import { log } from './log.js';
import Chart from 'chart.js';
import { dateFnsAdapter } from './chartjsDateAdapter.js';
import { de } from 'date-fns/locale';
import { Canvas } from '../types/canvas.js';


export const getScorePlot = async <P extends Prisma.TransactionClient>(userId: string, client: P, canvas: Canvas): Promise<Buffer> => {
    // HACK HACK HACK HACK HACK
    // https://github.com/chartjs/chartjs-adapter-date-fns/issues/58
    // also, importing `chartjs-adapter-date-fns` as intended gives us an error:
    // `The requested module 'chart.js' does not provide an export named '_adapters'`
    Chart._adapters._date.override(dateFnsAdapter);

    // this code is kinda messy, but the first part emulates the getScore function
    // we get all the reactions sent and received, and we just want to put them in one big array, sorted by date
    // then, we can reduce over the entire array in one sweep, creating a cumulative sum of the scores over time
    const reactionsSent = await client.reaction.findMany({
        where: { user: { id: userId } }
    });
    const sentGeneral = reactionsSent.map(r => ({ type: 'additive' as const, reaction: r }))

    // reactionsReceived are all reactions on a message where the user is the author
    const reactionsReceived = await client.reaction.findMany({
        where: { message: { author: { id: userId } } }
    });
    const receivedGeneral = reactionsReceived.map(r => ({ type: 'subtractive' as const, reaction: r }))

    // all reactions are sorted in ascending order of time
    const reactions = [...sentGeneral, ...receivedGeneral];
    reactions.sort((a, b) => a.reaction.createdAt.getTime() - b.reaction.createdAt.getTime());

    // now, I want to initialize the `data` array with an "initial" point of 1000
    // To make it actually visible, I'll set it to appear before the first point on the graph, 1/25th of the total time away
    const firstReaction = reactions[0].reaction.createdAt.getTime();
    const lastReaction = reactions[reactions.length - 1].reaction.createdAt.getTime();
    const initialTime = new Date(firstReaction - (lastReaction - firstReaction) / 25);

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
                            millisecond: 'MM dd HH:mm:ss.SSS',
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