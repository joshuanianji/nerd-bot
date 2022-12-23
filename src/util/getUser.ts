import { PrismaClient, User } from '@prisma/client';

// gets user from prisma DB, and makes one if one doesn't exist
export const getUser = async (id: string, prisma: PrismaClient): Promise<User> => {
    const user = await prisma.user.findUnique({
        where: {
            id,
        },
    });

    if (user) {
        return user;
    }

    return await prisma.user.create({
        data: {
            id,
        },
    });
}
