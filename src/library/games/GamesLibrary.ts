import { IGamesLibrary } from "../../interfaces/Game.interface";

/**
 * Contain a list of known games
 */
const gamesLibrary: IGamesLibrary = {
    "Overwatch": {
        binaries: ["Overwatch Launcher.exe"],
        label: "Overwatch"
    },
    "World Of Warcraft": {
        binaries: ["World of Warcraft Launcher.exe"]
    },
    "Battlefield 4": {
        binaries: ["bf4.exe"]
    }
}

export default gamesLibrary;