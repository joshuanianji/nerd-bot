import chalk from 'chalk';
import dayjs from 'dayjs';
import { Webhook } from 'discord-webhook-node';
import { Config } from '../config';

const getTime = () => {
    return chalk.bold.gray(dayjs().format('HH:mm:ss.SSS'))
}

// simple commands for logging to the console. Maybe i'll implement better logging later on.
// they're in a namespace so i can use this as `log.info()`, and also jump to definitions easier
export namespace log {
    export const info = (msg: string): void => {
        console.log(`${getTime()} [${chalk.cyan('INFO')}] ${msg}`);
    }
    export const success = (msg: string): void => {
        console.log(`${getTime()} [${chalk.green('SUCCESS')}] ${msg}`);
    }
    export const error = (msg: string): void => {
        console.log(`${getTime()} [${chalk.bold.red('ERROR')}] ${msg}`);
    }

    // for bad errors that need to be sent to my discord server
    // if running on dev, do not send (not necessary)
    export const sendError = (config: Config) => (title: string, err: string): void => {
        const extraInfo = config.ENV === 'dev' ? '' : ` (${chalk.green('sending to Discord')})`
        console.log(`${getTime()} [${chalk.bold.red('SEND ERROR')}]${extraInfo} ${title}\n${err}`);
        if (config.ENV === 'dev') return;

        const hook = new Webhook(config.WEBHOOK_URL);
        hook.error('**Nerdbot Failure!**', title, err)
            .catch(err => error("Log also failed to send!" + err));
    }

    // similarly for info that is important
    export const sendInfo = (config: Config) => (title: string, msg: string): void => {
        const extraInfo = config.ENV === 'dev' ? '' : ` (${chalk.green('sending to Discord')})`
        console.log(`${getTime()} [${chalk.bold.yellow('SEND INFO')}]${extraInfo} ${title}\n${msg}`);
        if (config.ENV === 'dev') return;

        const hook = new Webhook(config.WEBHOOK_URL);
        hook.info('**Nerdbot Info!**', title, msg)
            .catch(err => error("Log also failed to send!" + err));
    }
}