import { defaultConfig } from "./utils/config.utils";
import { readJsonSync, writeJsonSync, ensureDirSync } from "fs-extra";
import IConfig from "./interfaces/Config.interface";
import path from "path";
import { app } from "electron";
import { log, logWarn, logError } from "./utils/helper.utils";
const appName = "steam-scanner";

/**
 * Class that manage the config
 */
export default class Config {
    private _enableNotifications: boolean = defaultConfig.enableNotifications;
    private _launchOnStartup: boolean = defaultConfig.launchOnStartup;
    private _steamDirectory: string = defaultConfig.steamDirectory;
    private _launchers: object = defaultConfig.launchers;

    configPath = path.join(app.getPath("appData"), appName);
    configFilePath = path.join(this.configPath, "config.json")
    constructor() {
        this.loadConfig();
    }


    get enableNotifications(): boolean {
        return this._enableNotifications;
    }

    set enableNotifications(value: boolean) {
        this._enableNotifications = value;
        this.writeConfig();
    }

    get launchOnStartup(): boolean {
        return this._launchOnStartup;
    }

    set launchOnStartup(value: boolean) {
        this._launchOnStartup = value;
        this.writeConfig();
    }

    get steamDirectory(): string {
        return this._steamDirectory;
    }

    set steamDirectory(value: string) {
        this._steamDirectory = value;
        this.writeConfig();
    }

    get launchers(): object {
        return this._launchers;
    }

    set launchers(value: object) {
        this._launchers = value;
        this.writeConfig();
    }

    /**
     * Retrieve the current saved config and assign it to the class
     *
     * If unable to load the config, it will generate a clean one
     */
    private loadConfig(): IConfig {
        try {
            const config = readJsonSync(this.configFilePath) as IConfig;
            log("Config loaded");
            return config;
        } catch (error) {
            logWarn("Unable to load the config");
            return this.writeDefaultConfig();
        }
    }

    /**
     * Write the current config to the config file
     */
    private writeConfig() {

        const configToWrite: IConfig = {
            launchOnStartup: this._launchOnStartup,
            steamDirectory: this._steamDirectory,
            launchers: this._launchers,
            enableNotifications: this._enableNotifications
        }
        try {
            writeJsonSync(this.configFilePath, configToWrite);
        } catch (error) {
            logError(error);
            logError("Unable to write the config !");
        }
    }

    /**
     * Write a default config file
     * @return Written config data
     */
    private writeDefaultConfig(): IConfig {

        try {
            ensureDirSync(this.configPath);
            writeJsonSync(this.configFilePath, defaultConfig);
            log("The config has been reset");
            return defaultConfig;
        } catch (error) {
            // Unable to write the config, should crash
            logError(error);
            logError("Unable to write a config file, this is critical !!!\nThe process will now close")
            process.exit(0);
        }
    }

}