import { Client, ClientOptions } from 'discord.js';
import { Context } from './interfaces/context';
import * as util from './util';

// extending Discord.js's Client class

class ExtendedClient extends Client {
    context: Context;

    constructor(options: ClientOptions) {
        super(options);

        const [token, mode, appID] = util.getEnvVars(['DISCORD_TOKEN', 'MODE', 'APP_ID']);

        if (mode === 'development') {
            const [guildID, devEnv] = util.getEnvVars(['GUILD_ID', 'DEVS']);
            const devs = devEnv.split(',').map(id => id.trim());

            this.context = { token, mode, guildID, devs, appID }

        } else if (mode === 'production') {
            this.context = { token, mode, appID }
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
