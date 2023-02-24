
import { Prisma, Reaction } from '@prisma/client';
import { ChartConfiguration } from 'chart.js';
import { ChartJSNodeCanvas, ChartCallback } from 'chartjs-node-canvas';

export const getScorePlot = async <P extends Prisma.TransactionClient>(userId: string, client: P): Promise<Buffer> => {

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

    const reactions = [...sentGeneral, ...receivedGeneral];
    reactions.sort((a, b) => a.reaction.createdAt.getTime() - b.reaction.createdAt.getTime());

    console.log(reactions)

    const width = 600;
    const height = 350;
    // example line chart
    const configuration: ChartConfiguration = {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'My First dataset',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [0, 10, 5, 2, 20, 30, 45],
            }]
        },
        options: {
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
    const chartCallback: ChartCallback = (ChartJS) => {
        ChartJS.defaults.responsive = true;
        ChartJS.defaults.maintainAspectRatio = false;
    };
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });
    return chartJSNodeCanvas.renderToBuffer(configuration);
}