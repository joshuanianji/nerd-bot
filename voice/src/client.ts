import { Client, ClientOptions } from 'discord.js';
import { Context, Media } from './interfaces/context';
import * as util from './util';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { join } from 'path';
// extending Discord.js's Client class

class ExtendedClient extends Client {
    context: Context;

    constructor(options: ClientOptions) {
        const [envPath] = util.getEnvVars(['ENV_PATH']);
        console.log(`${chalk.blue('[INFO]')} Reading config from ${chalk.italic(envPath)}`);
        dotenv.config({ path: envPath });

        super(options);

        const [token, mode, appID, mediaPath] = util.getEnvVars(['DISCORD_TOKEN', 'MODE', 'APP_ID', 'MEDIA_PATH']);

        // get media
        const media: Media = { 'vine-boom': join(mediaPath, 'vine-boom.mp3') }

        if (mode === 'development') {
            const [guildID, devEnv] = util.getEnvVars(['GUILD_ID', 'DEVS']);
            const devs = devEnv.split(',').map(id => id.trim());

            this.context = { token, mode, guildID, devs, appID, media }

        } else if (mode === 'production') {
            this.context = { token, mode, appID, media }
        } else {
            throw new Error("Expecting MODE env var to be 'development' or 'production', but found " + process.env.MODE);
        }
        console.log('Initialized context: ', this.context);
    }

    public async init(): Promise<void> {
        await this.login(this.context.token);
    }
}

export default ExtendedClient;
