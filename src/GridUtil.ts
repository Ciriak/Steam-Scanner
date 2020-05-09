import { app } from "electron";
import path from "path";
import { rmdirSync, existsSync, createWriteStream } from "fs-extra";
import { logError, logWarn } from "./utils/helper.utils";
import IGame from "./interfaces/Game.interface";
import axios from "axios";
import Config from "./Config";

export default class GridUtil {
    baseCoverPath: string = path.join(app.getPath("appData"), "steam-scanner", "cachedcovers");
    private config: Config;
    constructor(config: Config) {
        this.config = config;
        // clear at launch
        this.clear();
    }

    /**
     * Retrieve the game cover from an external API and write it on the cache directory
     * @param gameData target game
     * @return cover file Path
     */
    async getCover(gameData: IGame): Promise<string> {

        const fileName = path.normalize(gameData.name) + ".png";
        const label = gameData.label;
        const filePath = path.join(this.baseCoverPath, fileName);
        const apiMethodUrl = this.config.apiUrl + "/game/" + label;

        return new Promise((resolve, reject) => {
            // retrieve the game infos
            axios.get(apiMethodUrl).then((res) => {

                // stop if one info is unavailable
                if (!res.data.data || !res.data.data[0] || !res.data.data[0].url) {
                    logWarn("Missing data in the APi response");
                    return reject();
                }

                // retrieve the cover file
                axios({
                    method: "get",
                    url: res.data.data[0].url,
                    responseType: "stream"
                }).then((fileResponse: any) => {
                    fileResponse.data.pipe(createWriteStream(filePath));
                    return resolve(filePath);
                });
            }).catch((err) => {
                logWarn(err);
                return reject();
            });
        })


    }

    /**
     * Clear all the temp icon files
     */
    clear() {
        if (existsSync(this.baseCoverPath)) {
            try {
                rmdirSync(this.baseCoverPath, {
                    recursive: true
                });
            } catch (error) {
                logError("Failed to clean the temp icons folder : \n" + error);
            }

        }

    }
}