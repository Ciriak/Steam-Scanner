import { Launcher } from "../Launcher";

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

export interface IGamesCollection {
    [name: string]: IGame
}

export interface IInstallationState {
    launcher: Launcher;
    installed: boolean;
}

export default interface ILauncher {
    name: string;
    exeName: string;
    exePossibleLocations: string[];
    /**
     * List of potentiel location of games
     */
    gamesPossibleLocations?: IGameLocation;
    games?: IGamesCollection;
    exeLocation?: string;
    icon: string;
}