import { Client, ClientOptions, Collection } from 'discord.js';
import { Config } from './config.js';
import { Command } from './types/command.js';
import { getCommands } from './commands.js';
import { log } from './util/log.js';
import chalk from 'chalk';
import { PrismaClient } from '@prisma/client';
import { ChartCallback } from 'chartjs-node-canvas';
import { Canvas, mkCanvas } from './types/canvas.js';

// incorporating the "ready" status for slightly better type inference in certain situations
class ExtendedClient<Ready extends boolean = boolean> extends Client<Ready> {
    // these are all slash commands we have
    private _commands: Collection<string, Command>;

    // necessary environment variables as a config is stored in Client as well
    private _config: Config;

    // how many reaction collectors we have - used in stat command
    private _reactionCollectors: number;

    private _prisma: PrismaClient;

    // multiple chartJsNodeCanvas objects will result in the date adapter erroring out
    // https://github.com/SeanSobey/ChartjsNodeCanvas/issues/96
    // to simplify things, I will just use one instance of the chartJsNodeCanvas object
    // alos, the solution mentioned does not work for esm lol
    private _canvas: Canvas;

    constructor(options: ClientOptions, config: Config) {
        super(options);

        this._config = config;

        // now, get all slash commands and store them (we register on the 'ready' event)
        this._commands = getCommands();

        this._reactionCollectors = 0;

        this._prisma = new PrismaClient();

        const chartCallback: ChartCallback = (ChartJS) => {
            ChartJS.defaults.responsive = false;
            ChartJS.defaults.maintainAspectRatio = false;
            ChartJS.defaults.devicePixelRatio = 2;
        };
        const width = 600;
        const height = 350;
        this._canvas = mkCanvas(width, height, chartCallback);
    }

    public async init() {
        // Log in to Discord with the client token
        log.info('Logging in...')
        await this.login(this.config.TOKEN);

        // Test prisma connection
        // https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-management#connect
        log.info('Connecting to prisma...')
        await this.prisma.$connect();

        log.success(`Successfully ran ${chalk.green('init()')} function`);
    }

    public decrementReactionCollector(): void {
        this._reactionCollectors -= 1;
    }

    public incrementReactionCollector(): void {
        this._reactionCollectors += 1;
    }

    // using oop getters and setters even though they are not necessary lol
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

    get canvas(): Canvas {
        return this._canvas;
    }
}

export default ExtendedClient;