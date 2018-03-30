import * as fs from "fs-extra";
import * as path from "path";
import { Steamer } from "./Steamer";

const drmList = {
  uplay: {
    possibleLocations: [
      "$drive\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\UbisoftGameLauncher.exe",
      "$drive\\Programmes\\Ubisoft\\Ubisoft Game Launcher\\UbisoftGameLauncher.exe"
    ]
  }
};

export class DRMManager {
  public drmList: any;
  public detectedDrm: any;
  private steamerInstance: Steamer;
  constructor(steamerInstance: Steamer) {
    this.steamerInstance = steamerInstance;
  }

  /**
   * Return a list of all found game (other than steam)
   */
  public getAllGames() {
    console.log("test");
  }
}
