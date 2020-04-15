import ILauncher from "../interfaces/Launcher.interface";


/**
 * BATTLENET
 */
const BattleNet: ILauncher = {
    name: "BattleNet",
    exeName: "Battle.net Launcher.exe",
    exePossibleLocations: [
        "$drive\\Program Files (x86)\\Battle.net",
        "$drive\\Programmes\\Battle.net"
    ]
}

/**
 * ORIGIN
 */
const Origin: ILauncher = {
    name: "Origin",
    exeName: "Origin.exe",
    exePossibleLocations: [
        "$drive\\Program Files (x86)\\Origin",
        "$drive\\Programmes\\Origin"
    ],
    gamesPossibleLocations: [
        {
            "path": "$drive\\Program Files (x86)\\Origin Games"
        },
        {
            "path": "$drive\\Programmes\\Origin Games"
        }
    ]
}

/**
 * UPLAY
 */
const Uplay: ILauncher = {
    name: "Uplay",
    exeName: "UbisoftGameLauncher.exe",
    exePossibleLocations: [
        "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher",
        "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher"
    ],
    gamesPossibleLocations: [
        {
            "path": "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games"
        },
        {
            "path": "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher\\games"
        }
    ]
}

const EpicGameLauncher: ILauncher = {
    name: "Epic Game Launcher",
    exeName: "EpicGamesLauncher.exe",
    exePossibleLocations: [
        "$drive\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win32",
        "$drive\\Programmes\\Epic Games\\Launcher\\Portal\\Binaries\\Win32"
    ],
    gamesPossibleLocations: [
        {
            "path": "$drive\\Program Files (x86)\\Epic Games"
        },
        {
            "path": "$drive\\Programmes\\Epic Games"
        }
    ]
}

// export const Library: ILauncher = {
//     name: "Library",
//     gamesPossibleLocations: [
//         {
//             "path": "$drive\\Program Files (x86)"
//         },
//         {
//             "path": "$drive\\Programmes"
//         }
//     ]
// }

const launchers: {
    [key: string]: ILauncher;
} = {
    EpicGameLauncher,
    Uplay,
    Origin,
    BattleNet
};

export default launchers;