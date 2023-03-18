import { z } from 'zod';

const Environment = z.discriminatedUnion('ENV', [
    z.object({
        ENV: z.literal('dev'),
        // the ID of the server we are developing in 
        DEV_SERVER: z.string().min(1)
    }),
    z.object({ ENV: z.literal('prod') }),
])

const Shared = z.object({
    TOKEN: z.string().min(1),
    WEBHOOK_URL: z.string().min(1),
    DEV_IDS: z.string().min(1).transform((ids) => ids.split(' ')),
    DATABASE_URL: z.string().min(1),
    GITHUB_TOKEN: z.string().min(1),
})

export const configSchema = Environment.and(Shared);

export type Config = z.TypeOf<typeof configSchema>;
