import { Prisma, User } from '@prisma/client';

/**
 * gets user from prisma DB, and creates one if it doesn't exist
 * 
 * https://github.com/prisma/prisma/discussions/5815
 * @param id user id
 * @param prisma prisma client OR prisma transaction client
 * @returns the User object
 */
export const upsertUser = async <P extends Prisma.TransactionClient>(id: string, client: P): Promise<User> =>
    await client.user.upsert({
        where: { id },
        update: {},
        create: {
            id
        },
    });
