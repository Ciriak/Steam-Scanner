import { Launcher } from "../../Launcher";
import colors from "colors";
import battlenetIcon from "../../assets/launchers/battlenet.png";
import SteamScanner from "../../app";
export default class BattleNet extends Launcher {
    name = "BattleNet";
    label = "Battle Net";
    exeName = "Battle.net Launcher.exe";
    exePossibleLocations = [
        "$drive\\Program Files (x86)\\Battle.net",
        "$drive\\Programmes\\Battle.net"
    ];
    icon = battlenetIcon;

    constructor(scanner: SteamScanner) {
        super(scanner);
        this.hydrateFromConfig();
        this.nameLabel = colors.cyan("[" + this.label + "]");
    }
}