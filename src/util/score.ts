import { Prisma } from '@prisma/client';

// score related functions

/**
 * Returns the score of a user, based on all reactions and their weights
 */
export const getScoreNew = async <P extends Prisma.TransactionClient>(userId: string, prisma: P): Promise<number> => {
    const reactionsSent = await prisma.reactionNew.findMany({
        where: {
            user: { id: userId }
        }
    });

    // reactionsReceived are al reactions on a message where the user is the author
    const reactionsReceived = await prisma.reactionNew.findMany({
        where: {
            message: { author: { id: userId } }
        }
    });

    const scoreReacted = reactionsSent.map(r => r.deltaA).reduce((a, b) => a + b, 0);
    const scoreReactee = reactionsReceived.map(r => r.deltaB).reduce((a, b) => a + b, 0);
    return 1000 + scoreReacted + scoreReactee;
}

/**
 * Old getScore. 
 * TODO: Remove (this is just here for the migration!)
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

/**
 * Given user1 and user2, where **user1 reacted to user2**
 * calculate the score deltas
 * 
 * Note user1 reacting to user2 is the ELO equivalent of user1 winning
 */
export const scoreDeltas = (scoreA: number, scoreB: number): [number, number] => {
    // k = 32 seems to be a good value for now, i'll probably make this configurable later
    const k = 32;

    const probA = eloProbability(scoreA, scoreB);
    const probB = eloProbability(scoreB, scoreA);

    const deltaA = k * (1 - probA);
    const deltaB = k * (0 - probB);

    return [deltaA, deltaB];
}

/** 
 * Given two scores, calculate ELO probability.
 * https://www.geeksforgeeks.org/elo-rating-algorithm/
 */
const eloProbability = (scoreA: number, scoreB: number): number =>
    (1.0 * 1.0) / (1 + 1.0 * Math.pow(10, (1.0 * (scoreA - scoreB)) / 400))
