import { Launcher } from "../../Launcher";
import colors from "colors";
import originIcon from "../../assets/launchers/origin.png";
import SteamScanner from "../../app";
export default class Origin extends Launcher {
    name = "Origin"
    label = "Origin"
    exeName = "Origin.exe"
    exePossibleLocations = [
        "$drive\\Program Files (x86)\\Origin",
        "$drive\\Programmes\\Origin"
    ]
    gamesPossibleLocations = {
        include: [
            "$drive\\Program Files (x86)\\Origin Games",
            "$drive\\Programmes\\Origin Games"
        ]
    }
    icon = originIcon;

    constructor(scanner: SteamScanner) {
        super(scanner);
        this.hydrateFromConfig();
        this.nameLabel = colors.yellow("[" + this.label + "]");
    }
}