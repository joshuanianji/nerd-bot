import chalk from 'chalk';
import dayjs from 'dayjs';

const getTime = () => {
    return chalk.bold.gray(dayjs().format('HH:mm:ss.SSS'))
}

// simple commands for logging to the console. Maybe i'll implement better logging later on.
// they're in this weird default object so i can use this as `log.info()`, and also jump to definitions easier
export default {
    info: (msg: string): void => {
        console.log(`${getTime()} [${chalk.cyan('INFO')}] ${msg}`);
    },
    success: (msg: string): void => {
        console.log(`${getTime()} [${chalk.green('SUCCESS')}] ${msg}`);
    },
    error: (msg: string): void => {
        console.log(`${getTime()} [${chalk.bold.green('ERROR')}] ${msg}`);
    }
}