import * as fs from "fs-extra";
import * as path from "path";
import { Steamer } from "./Steamer";

export class DRMManager {
  public detectedDrm: string[] = [];
  public drmList = {
    Uplay: {
      name: "Uplay",
      exeLocations: [
        "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\UbisoftGameLauncher.exe",
        "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher\\UbisoftGameLauncher.exe"
      ]
    },
    Origin: {
      name: "Origin",
      exeLocations: [
        "$drive\\Program Files (x86)\\Origin\\Origin.exe",
        "$drive\\Programmes\\Origin\\Origin.exe"
      ],
      gamesLocations: [
        "$drive\\Program Files (x86)\\Origin Games",
        "$drive\\Programmes\\Origin Games"
      ]
    }
  };
  private steamerInstance: Steamer;
  constructor(steamerInstance: Steamer) {
    this.steamerInstance = steamerInstance;
  }

  /**
   * Return a list of all found game (other than steam)
   */
  public async getAllGames(): Promise<any> {
    for (const drnname in this.drmList) {
      if (this.drmList.hasOwnProperty(drnname)) {
        const drm = this.drmList[drnname];
        await console.log("test"); // this.checkDRMInstallations(drm);
      }

    }
  }

  public checkDRMInstallations(drm: any) {
    this.steamerInstance.addDrivesToPossibleLocations(
      drm.exeLocations,
      (parsedLocations) => {
        // first we locate steam directory
        for (const loc of parsedLocations) {
          // try to list all the users in the userdata folder of steam
          if (fs.existsSync(loc)) {
            drm.exe = loc;
            break;
          }
        }
        if (drm.exe) {
          this.detectedDrm.push(drm.name);
          this.steamerInstance.log(drm.name + " located at " + drm.exe);
          return;
        }
      }
    );
  }

  public checkGamesForDrm(drm: any) {
    this.steamerInstance.addDrivesToPossibleLocations(
      drm.gamesLocations,
      (parsedLocations) => {
        console.log(parsedLocations);
        // first we locate steam directory
        for (const loc of parsedLocations) {
          // try to list all the users in the userdata folder of steam
          if (fs.existsSync(loc)) {
            drm.exe = loc;
            break;
          }
        }
        if (drm.exe) {
          this.detectedDrm.push(drm.name);
          this.steamerInstance.log(drm.name + " located at " + drm.exe);
          return;
        }
      }
    );
  }
}
