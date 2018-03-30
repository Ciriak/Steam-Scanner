declare const Promise: any;
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import { SteamerHelpers } from "./SteamerHelpers";
const helper: SteamerHelpers = new SteamerHelpers();

// For the gamesProperties :
// %APPDATA% => appData method of Electron
// $this.xxx = a propertie of the current item (ex : name)
const drmList = [
  {
    name: "Uplay",
    exePossibleLocations: [
      "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\UbisoftGameLauncher.exe",
      "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher\\UbisoftGameLauncher.exe"
    ],
    configProperties: {
      configFilePath: "%APPDATA%/Local/Ubisoft Game Launcher/settings.yml",
      configFileType: "yml",
      gamesPathPropertieName: "misc.game_installation_path"
    }
  },
  {
    name: "Origin",
    exePossibleLocations: [
      "$drive\\Program Files (x86)\\Origin\\Origin.exe",
      "$drive\\Programmes\\Origin\\Origin.exe"
    ],
    configProperties: {
      configFilePath: "%APPDATA%/Roaming/Origin/local.xml",
      configFileType: "xml",
      gamesPathPropertieName: "DownloadInPlaceDir"
    }
  }
];

export class DRM {
  public name: any;
  public isAvailable: boolean;
  public exePossibleLocations: string[] = [];
  public exeLocation: string;
  public configProperties: any;

  constructor(drmName: string) {
    // find the drm from the list and add the properties
    const drmIndexFromList = _.indexOf(drmList, {
      name: drmName
    });
    if (drmIndexFromList === -1) {
      throw new Error("ERR_UNKNOWN_DRM");
    }
    const drmFromList = drmList[drmIndexFromList];
    this.name = drmFromList.name;
    this.exePossibleLocations = drmFromList.exePossibleLocations;
    this.configProperties = drmFromList.configProperties;
  }

  public async checkInstallation() {
    const parsedPossibleLocations: string[] = await helper.addDrivesToPossibleLocations(
      this.exePossibleLocations
    );
    return new Promise((resolve) => {
      // first we locate steam directory
      for (const loc of parsedPossibleLocations) {
        // try to list all the users in the userdata folder of steam
        if (fs.existsSync(loc)) {
          this.exeLocation = loc;
          break;
        }
      }
      if (this.exeLocation) {
        this.isAvailable = true;
        helper.log(this.name + " located at " + this.exeLocation);
      } else {
        helper.log(this.name + " not found");
      }
      resolve();
    });
  }

  public getGames() {
    return false;
  }
}
