import { Prisma } from '@prisma/client';
import { log } from './log.js';
import Chart from 'chart.js';
import { dateFnsAdapter } from './chartjsDateAdapter.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { de } from 'date-fns/locale';


export const getScorePlot = async <P extends Prisma.TransactionClient>(userId: string, client: P, canvas: ChartJSNodeCanvas): Promise<Buffer> => {
    // HACK HACK HACK HACK HACK
    // https://github.com/chartjs/chartjs-adapter-date-fns/issues/58
    // also, importing `chartjs-adapter-date-fns` as intended gives us an error:
    // `The requested module 'chart.js' does not provide an export named '_adapters'`
    Chart._adapters._date.override(dateFnsAdapter);

    log.info(`getting score plot for user ${userId}`)

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

    // here, we finally collect the data
    const data = [];
    let score = 1000;
    for (const reaction of reactions) {
        if (reaction.type === 'additive') {
            score += reaction.reaction.weight;
        } else {
            score -= reaction.reaction.weight;
        }
        data.push({ y: score, x: reaction.reaction.createdAt.getMilliseconds() });
    }

    console.log(data)

    const width = 600;
    const height = 350;

    // example line chart
    log.info('Collected data. Generating chart...')
    const configuration: Chart.ChartConfiguration = {
        type: 'line',
        data: {
            datasets: [{
                data: data
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
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
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }
        }]
    };
    log.info('Rendering chart...')
    return canvas.renderToBuffer(configuration);
}