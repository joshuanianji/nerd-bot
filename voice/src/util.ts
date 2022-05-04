/**
 * returns a list of requested env variables
 * 
 * this function was made by Copilot!
 */
export const getEnvVars = (envVars: string[]): string[] => {
    const initialVal: string[] = [];
    return envVars.reduce((acc, curr) => {
        const val = process.env[curr];
        if (!val) {
            throw new Error(`Environment variable '${curr}' is not defined!`);
        }
        return [...acc, val];
    }, initialVal);
}
