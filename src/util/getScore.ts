import { Prisma, User } from '@prisma/client';

/**
 * Returns the score of a user, based on all reactions and their weights
 */
export const getScore = async <P extends Prisma.TransactionClient>(userId: string, client: P): Promise<number> => {
    const reactionsSent = await client.reaction.findMany({
        where: {
            user: { id: userId }
        }
    });

    // reactionsReceived are al reactions on a message where the user is the author
    const reactionsReceived = await client.reaction.findMany({
        where: {
            message: { author: { id: userId } }
        }
    });;

    const scoreAdd = reactionsSent.map(r => r.weight).reduce((a, b) => a + b, 0);
    const scoreSub = reactionsReceived.map(r => r.weight).reduce((a, b) => a + b, 0);
    return 1000 + scoreAdd - scoreSub;
}