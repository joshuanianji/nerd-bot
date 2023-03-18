import { Prisma } from '@prisma/client';

/**
 * Returns the score of a user, based on all reactions and their weights
 */
export const getScore = async <P extends Prisma.TransactionClient>(userId: string, prisma: P): Promise<number> => {
    const reactionsSent = await prisma.reaction.findMany({
        where: {
            user: { id: userId }
        }
    });

    // reactionsReceived are al reactions on a message where the user is the author
    const reactionsReceived = await prisma.reaction.findMany({
        where: {
            message: { author: { id: userId } }
        }
    });

    const scoreAdd = reactionsSent.map(r => r.weight).reduce((a, b) => a + b, 0);
    const scoreSub = reactionsReceived.map(r => r.weight).reduce((a, b) => a + b, 0);
    return 1000 + scoreAdd - scoreSub;
}