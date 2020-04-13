export interface IGameLocation {
    path: string;
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