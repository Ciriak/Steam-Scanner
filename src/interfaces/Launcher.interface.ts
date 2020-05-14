import { Launcher } from "../Launcher";
import IGame from "./Game.interface";

export interface IGameLocation {
    /**
     * path that have to be scanned
     */
    include: string[],
    /**
     * Folders that should be ignored
     *
     * @example DirectXRedist
     */
    exclude?: string[]
};

export interface ILaunchersCollection {
    [name: string]: ILauncher
}

export interface IGamesCollection {
    [name: string]: IGame
}

export interface IInstallationState {
    launcher: Launcher;
    installed: boolean;
}

export default interface ILauncher {
    [propName: string]: any
    /**
     * Name of the launcher
     */
    name: string;
    /**
     * Displayed name of the launcher
     */
    label: string;
    /**
     * Name of the executable file of the launcher
     */
    exeName: string;
    /**
     * List of possible location of the executable of the launcher
     */
    exePossibleLocations: string[];
    /**
     * List of possible location of the games folders for the launcher
     */
    gamesPossibleLocations?: IGameLocation;
    /**
     * Saved list of games associated with the launcher
     */
    games: IGamesCollection;
    /**
     * Saved exe location of the launcher
     */
    exeLocation?: string;
    /**
     * Path to the icon of the launcher
     */
    icon: string;
}