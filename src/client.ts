import { Client, ClientOptions, Collection } from 'discord.js';
import { Config } from './config';
import { Command } from './types/command';
import { getCommands } from './commands';
import log from './util/log';
import chalk from 'chalk';

// incorporating the "ready" status for slightly better type inference in certain situations
class ExtendedClient<Ready extends boolean = boolean> extends Client<Ready> {
    // these are slash commands
    public commands: Collection<string, Command>;

    // nevessary environment variables as a config is stored in Client as well
    public config: Config;

    constructor(options: ClientOptions, config: Config) {
        super(options);

        this.config = config;

        // now, get all slash commands and store them (we register on the 'ready' event)
        this.commands = getCommands();
    }

    public async init() {
        // Log in to Discord with the client token
        await this.login(this.config.TOKEN);

        // right now, init() does nothing else. Maybe make connections to database?
        log.info(`Successfully ran ${chalk.green('init()')} function`);
    }
}

export default ExtendedClient;