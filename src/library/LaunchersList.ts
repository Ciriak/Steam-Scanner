import ILauncher from "../interfaces/Launcher.interface";
import uplayIcon from "../assets/launchers/uplay.png";
import originIcon from "../assets/launchers/origin.png";
import epicIcon from "../assets/launchers/epic.png";
import steamIcon from "../assets/launchers/steam.png";
import battlenetIcon from "../assets/launchers/battlenet.png";

/**
 * BATTLENET
 */
const BattleNet: ILauncher = {
    name: "BattleNet",
    label: "Battle Net",
    exeName: "Battle.net Launcher.exe",
    exePossibleLocations: [
        "$drive\\Program Files (x86)\\Battle.net",
        "$drive\\Programmes\\Battle.net"
    ],
    icon: battlenetIcon
}

/**
 * ORIGIN
 */
const Origin: ILauncher = {
    name: "Origin",
    label: "Origin",
    exeName: "Origin.exe",
    exePossibleLocations: [
        "$drive\\Program Files (x86)\\Origin",
        "$drive\\Programmes\\Origin"
    ],
    gamesPossibleLocations: {
        include: [
            "$drive\\Program Files (x86)\\Origin Games",
            "$drive\\Programmes\\Origin Games"
        ]
    },
    icon: originIcon
}

/**
 * UPLAY
 */
const Uplay: ILauncher = {
    name: "Uplay",
    label: "Uplay",
    exeName: "UbisoftGameLauncher.exe",
    exePossibleLocations: [
        "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher",
        "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher"
    ],
    gamesPossibleLocations: {
        include: [
            "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games",
            "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher\\games"
        ]
    },
    icon: uplayIcon
}

const EpicGameLauncher: ILauncher = {
    name: "EpicGameLauncher",
    label: "Epic Game launcher",
    exeName: "EpicGamesLauncher.exe",
    exePossibleLocations: [
        "$drive\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win32",
        "$drive\\Programmes\\Epic Games\\Launcher\\Portal\\Binaries\\Win32"
    ],
    gamesPossibleLocations: {
        include: [
            "$drive\\Program Files (x86)\\Epic Games",
            "$drive\\Programmes\\Epic Games"
        ],
        exclude: [
            "Launcher",
            "DirectXRedist"
        ]
    },
    icon: epicIcon
}

const launchers: {
    [key: string]: ILauncher;
} = {
    EpicGameLauncher,
    Uplay,
    Origin,
    BattleNet
};

export default launchers;