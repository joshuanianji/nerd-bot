// manually migrating the old data to the new schema
// assumes current datavbase is loaded with the prod data

import { PrismaClient } from '@prisma/client';
import { addNerdReaction } from '../src/util/collectNerdReaction';
import { KindofDiscordMessage } from '../src/util/upsertMessage';
import { execa } from 'execa';
import dotenv from 'dotenv';

const prisma = new PrismaClient()



await prisma.$disconnect();
