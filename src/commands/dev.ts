import { Command } from '../types/command.js';
import { pgdump } from './dev/pgdump.js';
import { pgpush } from './dev/pgpush.js';

export const dev: Command = {
    name: 'dev',
    description: 'Dev only commands',
    dm_permission: false,
    run: async (client, intr) => {
        // if the user is not the developer, return
        if (!client.config.DEV_IDS.includes(intr.user.id)) {
            await intr.reply('Sorry, you need to be a developer to use this command! Maybe make a pr on github 😳?');
            return;
        }

        const subcommand = intr.options.getSubcommand();
        if (subcommand === 'pgdump') {
            return pgdump(client.config, intr);
        } else if (subcommand === 'pgpush') {
            return pgpush(client, intr);
        } else {
            await intr.reply('Unknown subcommand!');
            return;
        }
    },
    // https://stackoverflow.com/a/71050529
    updateBuilder(builder) {
        builder
            .addSubcommand(subcommand =>
                subcommand
                    .setName('pgdump')
                    .setDescription('Get a dump of the database')
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('pgpush')
                    .setDescription('Push a dump of the database to the repo')
            )
    }
}
