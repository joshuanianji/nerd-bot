import chalk from 'chalk';

// simple commands for logging to the console. Maybe i'll implement better logging later on.
// they're in this weird default object so i can use this as `log.info()`, and also jump to definitions easier
export default {
    info: (msg: string): void => {
        console.log(`[${chalk.cyan('INFO')}] ${msg}`);
    },
    success: (msg: string): void => {
        console.log(`[${chalk.green('SUCCESS')}] ${msg}`);
    },
    error: (msg: string): void => {
        console.log(`[${chalk.bold.green('ERROR')}] ${msg}`);
    }
}