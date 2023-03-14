import { Prisma } from '@prisma/client';
import Chart from 'chart.js';
import { ChartJSNodeCanvas, ChartCallback } from 'chartjs-node-canvas';
import { dateFnsAdapter } from './chartjsDateAdapter.js';
// import 'chartjs-adapter-date-fns';


export const getScorePlot = async <P extends Prisma.TransactionClient>(userId: string, client: P): Promise<Buffer> => {
    // HACK HACK HACK HACK HACK
    // https://github.com/chartjs/chartjs-adapter-date-fns/issues/58
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

    const width = 600;
    const height = 350;

    // example line chart
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
                        // use date-fns (should be automatic?)
                    }
                }
            }
        }

    };
    const chartCallback: ChartCallback = (ChartJS) => {
        ChartJS.defaults.responsive = true;
        ChartJS.defaults.maintainAspectRatio = false;
    };
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });
    return chartJSNodeCanvas.renderToBuffer(configuration);
}