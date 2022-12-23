import { Client, ClientOptions, Collection } from 'discord.js';
import { Config } from './config';
import { Command } from './types/command';
import { getCommands } from './commands';
import { log } from './util/log';
import chalk from 'chalk';
import { Prisma, PrismaClient } from '@prisma/client';

// incorporating the "ready" status for slightly better type inference in certain situations
class ExtendedClient<Ready extends boolean = boolean> extends Client<Ready> {
    // these are all slash commands we have
    private _commands: Collection<string, Command>;

    // necessary environment variables as a config is stored in Client as well
    private _config: Config;

    // how many reaction collectors we have - used in stat command
    private _reactionCollectors: number;

    private _prisma: PrismaClient;

    constructor(options: ClientOptions, config: Config) {
        super(options);

        this._config = config;

        // now, get all slash commands and store them (we register on the 'ready' event)
        this._commands = getCommands();

        this._reactionCollectors = 0;

        this._prisma = new PrismaClient();
    }

    public async init() {
        // Log in to Discord with the client token
        await this.login(this.config.TOKEN);

        // right now, init() does nothing else. Maybe make connections to database?
        log.info(`Successfully ran ${chalk.green('init()')} function`);
    }

    public decrementReactionCollector(): void {
        this._reactionCollectors -= 1;
    }

    public incrementReactionCollector(): void {
        this._reactionCollectors += 1;
    }

    get reactionCollectors(): number {
        return this._reactionCollectors;
    }

    get config(): Config {
        return this._config;
    }

    get commands(): Collection<string, Command> {
        return this._commands;
    }

    get prisma(): PrismaClient {
        return this._prisma;
    }
}

export default ExtendedClient;