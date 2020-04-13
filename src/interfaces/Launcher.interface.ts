import { Launcher } from "../Launcher";

export interface IGameLocation {
    path: string;
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
    games?: {
        [name: string]: IGame
    }
}