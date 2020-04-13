import { Launcher } from "../Launcher";

export interface IGameLocation {
    path: string;
}

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
    exePossibleLocations: string[],
    gamesPossibleLocations?: IGameLocation[],
    games?: IGamesCollection
}