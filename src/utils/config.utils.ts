import IConfig from "../interfaces/Config.interface";

export const defaultConfig: IConfig = {
    enableNotifications: true,
    autoRestartSteam: true,
    launchOnStartup: true,
    firstLaunch: true,
    steamDirectory: "",
    steamExe: "",
    launchers: {}
};