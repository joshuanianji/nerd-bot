
import { execa } from 'execa';
import { Config } from '../../config.js';
import { ChatInputCommandInteraction } from 'discord.js';

export const pgdump = async (config: Config, intr: ChatInputCommandInteraction): Promise<void> => {
    // execute pgdump command: `pg_dump --no-owner --dbname=postgresql://postgres:admin@db:5432/postgres > file.sql`
    // Ignoring the next line types because, somehow, there's a type error: "Cannot invoke an object which is possibly 'undefined'"
    // @ts-ignore
    await execa('pg_dump', ['--no-owner', `--dbname=${config.DATABASE_URL}`]).pipeStdout(`./dump.sql`);
    const fileSize = (await execa('du', ['-h', `./dump.sql`])).stdout.split('\t')[0];

    // gzip the file
    await execa('gzip', [`./dump.sql`]);
    const zippedFileSize = (await execa('du', ['-h', `./dump.sql.gz`])).stdout.split('\t')[0];

    await intr.reply({
        files: [`./dump.sql.gz`],
        content: `Uncompressed size: \`${fileSize}.\` Uploaded size: \`${zippedFileSize}.\``
    });

    // we choose not to delete the file because it'll be overwritten on the next dump
    return;
}

