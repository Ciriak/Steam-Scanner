import electronLog from "electron-log";
import colors from "colors";
import path from "path"
/**
 * Log a message
 * @param message
 */
export function log(message: string) {
    electronLog.log(message);
}

/**
 * Log a warning
 * @param message
 */
export function logWarn(message: string) {
    electronLog.warn(colors.yellow(message));
}

/**
 * Log an error
 * @param message
 */
export function logError(message: string) {
    electronLog.error(colors.red(message));
}

/**
 * Log a debug message
 * @param message
 */
export function logDebug(message: string) {
    electronLog.debug(colors.cyan(message));
}

/**
 * Take a list of possible location and extend it to all drive available on the machine
 * return the same object with more propertyes
 * $drive is replaced
 * @param possibleLocations List of possible locations (path)
 */
export async function addDrivesToPossibleLocations(possibleLocations: string[]): Promise<string[]> {
    return new Promise(async (resolve) => {

        if (!possibleLocations || possibleLocations.length === 0) {
            return resolve([]);
        }


        const drives = await getDisks();
        const parsedPossibleLocations: string[] = [];
        for (const drive of drives) {
            for (const loc of possibleLocations) {
                if (typeof loc !== "string") {
                    continue;
                }
                parsedPossibleLocations.push(
                    path.normalize(loc.replace("$drive", drive))
                );
            }
        }

        resolve(parsedPossibleLocations);

    });
}

/**
 * Retrieve the list of the Disks on the system
 * @return Array of disks
 * @example => ["C:", "D:"]
 */
export async function getDisks(): Promise<string[]> {
    return new Promise((resolve) => {
        const child = require('child_process');

        child.exec('wmic logicaldisk get name', (error: Error, stdout: string) => {

            if (error) {
                logError(error.message);
                process.exit();
            }

            const disks =
                stdout.split('\r\r\n')
                    .filter(value => /[A-Za-z]:/.test(value))
                    .map(value => value.trim());

            resolve(disks);
        });
    })
}
