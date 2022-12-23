import { z } from 'zod'
// defining config, parsed from environment variables

// export const envSchema = z.object({
//     TOKEN: z.string().min(1)

// });

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
    WEBHOOK_URL: z.string().min(1)
})

export const configSchema = Environment.and(Shared);

export type Config = z.TypeOf<typeof configSchema>;