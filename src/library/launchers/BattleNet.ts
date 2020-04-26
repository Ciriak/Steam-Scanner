import { Launcher } from "../../Launcher";
import colors from "colors";
import battlenetIcon from "../../assets/launchers/battlenet.png";
import SteamScanner from "../../app";
import dbInfo from '../../assets/db/battlenetDbFormat.json';
import protoBuf from "protobufjs";
import path from "path";
import { readFileSync, lstatSync } from "fs-extra";
import { log, addDrivesToPossibleLocations } from "../../utils/helper.utils";
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

    /**
     * Load the game directories into the class
     */
    protected async loadGamesDirectories(): Promise<any> {

        let count: number = 0;

        return new Promise(async (resolve) => {

            log(`${this.nameLabel} Looking for game directories...`);

            const gamesList = this.readBlizzardDbFile();
            count = gamesList.length;

            for (const gamePath of gamesList) {

                const gameName = path.basename(gamePath);
                this.games[gameName] = {
                    folderPath: gamePath,
                    launcher: this.name,
                    name: gameName,
                    binaries: []
                }
            }

            log(`${this.nameLabel} ${count} possible game folder(s) found`);

            resolve();
        });
    }

    private readBlizzardDbFile(): string[] {
        /**
         * Exclude the launcher and agent
         */
        const pCodeExcludeList = [
            'bna', 'agent'
        ];
        const proot = protoBuf.Root.fromJSON(dbInfo as any);
        const decoder = proot.lookupType('Database');
        const buffer = readFileSync("C:\\ProgramData\\Battle.net\\Agent\\product.db")
        const data = decoder.decode(buffer)
        const jsonData = data.toJSON();

        const gameFolders = [];

        for (const product of jsonData.productInstall) {
            // if the product is in the exclude list
            if (pCodeExcludeList.indexOf(product.productCode) > -1) {
                continue;
            }
            gameFolders.push(product.settings.installPath)
        }

        return gameFolders;

    }


}