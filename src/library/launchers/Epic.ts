import { Launcher } from "../../Launcher";
import colors from "colors";
import epicIcon from "../../assets/launchers/epic.png";
import SteamScanner from "../../app";
export default class Epic extends Launcher {

    name = "EpicGameLauncher"
    label = "Epic Game launcher"
    exeName = "EpicGamesLauncher.exe"
    exePossibleLocations = [
        "$drive\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win32",
        "$drive\\Programmes\\Epic Games\\Launcher\\Portal\\Binaries\\Win32"
    ]
    gamesPossibleLocations = {
        include: [
            "$drive\\Program Files (x86)\\Epic Games",
            "$drive\\Programmes\\Epic Games",
            "$drive\\Program Files\\Epic Games"
        ],
        exclude: [
            "Launcher",
            "DirectXRedist"
        ]
    }
    icon = epicIcon

    constructor(scanner: SteamScanner) {
        super(scanner);
        this.hydrateFromConfig();
        this.nameLabel = colors.gray("[" + this.label + "]");
    }
}
