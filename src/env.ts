import { z } from 'zod'
// defining env variables

export const envSchema = z.object({
    TOKEN: z.string().min(1)
});
