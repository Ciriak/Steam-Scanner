import { Launcher } from "../../Launcher";
import colors from "colors";
import uplayIcon from "../../assets/launchers/uplay.png";
import SteamScanner from "../../app";
export default class Uplay extends Launcher {
    name = "Uplay"
    label = "Uplay"
    exeName = "UbisoftGameLauncher.exe"
    exePossibleLocations = [
        "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher",
        "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher"
    ]
    gamesPossibleLocations = {
        include: [
            "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games",
            "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher\\games"
        ]
    }
    icon = uplayIcon

    constructor(scanner: SteamScanner) {
        super(scanner);
        this.hydrateFromConfig();
        this.nameLabel = colors.blue("[" + this.label + "]");
    }
}