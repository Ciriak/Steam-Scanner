import { app } from "electron";
import path from "path";
import extractIcon from "extract-file-icon";
import { writeFileSync, rmdirSync, existsSync } from "fs";
import { ensureDirSync } from "fs-extra";
import { logError, log } from "./utils/helper.utils";
import defaultExeIcon from "./assets/tray/exe.png";

interface IIconInfos {
    16: string;
    32: string;
    64: string;
};

export default class IconsUtil {
    baseIconPath: string = path.join(app.getPath("appData"), "steam-scanner", "cachedicons")
    constructor() {
        // clear at launch
        this.clear();
    }

    /**
     * Generate an icon file from a file and return a list of temp files
     * @param filePath file to get the icon from
     */
    getIcon(filePath: string): IIconInfos {
        try {
            // return base if path don't exist
            if (!existsSync(filePath)) {
                return {
                    "16": defaultExeIcon,
                    "32": defaultExeIcon,
                    "64": defaultExeIcon
                }
            }
            const iconData16 = extractIcon(filePath, 16);
            const iconData32 = extractIcon(filePath, 32);
            const iconData64 = extractIcon(filePath, 64);

            const fileName = path.basename(filePath);
            ensureDirSync(this.baseIconPath);
            writeFileSync(path.join(this.baseIconPath, fileName + "-x16.png"), iconData16);
            writeFileSync(path.join(this.baseIconPath, fileName + "-x32.png"), iconData32);
            writeFileSync(path.join(this.baseIconPath, fileName + "-x64.png"), iconData64);

            return {
                16: path.join(this.baseIconPath, fileName + "-x16.png"),
                32: path.join(this.baseIconPath, fileName + "-x32.png"),
                64: path.join(this.baseIconPath, fileName + "-x64.png")
            }
        } catch (error) {
            // return the default exe icon if unable to generate
            logError(error);
            return {
                "16": defaultExeIcon,
                "32": defaultExeIcon,
                "64": defaultExeIcon
            }
        }

    }

    /**
     * Clear all the temp icon files
     */
    clear() {
        if (existsSync(this.baseIconPath)) {
            rmdirSync(this.baseIconPath, {
                recursive: true
            });
        }

    }
}