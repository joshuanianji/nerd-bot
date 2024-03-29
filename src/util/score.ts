import { Prisma } from '@prisma/client';

// score related functions

/**
 * Returns the score of a user, based on all reactions and their weights
 */
export const getScore = async <P extends Prisma.TransactionClient>(userId: string, prisma: P, date?: Date): Promise<number> => {
    const reactionsSent = await prisma.reaction.findMany({
        where: {
            user: { id: userId },
            createdAt: { lte: date ?? new Date() }
        }
    });

    // reactionsReceived are al reactions on a message where the user is the author
    const reactionsReceived = await prisma.reaction.findMany({
        where: {
            message: { author: { id: userId } },
            createdAt: { lte: date ?? new Date() }
        }
    });

    const scoreReacted = reactionsSent.map(r => r.deltaA).reduce((a, b) => a + b, 0);
    const scoreReactee = reactionsReceived.map(r => r.deltaB).reduce((a, b) => a + b, 0);
    return 1000 + scoreReacted + scoreReactee;
}

/**
 * Given user1 and user2, where **user1 reacted to user2**
 * calculate the score deltas
 * 
 * Note user1 reacting to user2 is the ELO equivalent of user1 "losing"
 * this is because we want the user who reacts to lose nerd score (you get more nerdy when people react to you)
 */
export const scoreDeltas = (scoreA: number, scoreB: number): [number, number] => {
    // k = 32 seems to be a good value for now, i'll probably make this configurable later
    const k = 32;

    // probabilities of players A and B "winning"
    const probA = eloProbability(scoreB, scoreA);
    const probB = eloProbability(scoreA, scoreB);

    const deltaA = k * (0 - probA);
    const deltaB = k * (1 - probB);

    return [deltaA, deltaB];
}

/** 
 * Given two scores, calculate ELO probability.
 * https://www.geeksforgeeks.org/elo-rating-algorithm/
 */
const eloProbability = (scoreA: number, scoreB: number): number =>
    1 / (1 + Math.pow(10, (scoreA - scoreB) / 400))
