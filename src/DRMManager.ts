declare const Promise: any;
import * as fs from "fs-extra";
import * as path from "path";
import { DRM } from "./DRM";
import { SteamerHelpers } from "./SteamerHelpers";
const helper: SteamerHelpers = new SteamerHelpers();

export class DRMManager {
  public drmList: any;
  public detectedDrm: DRM[];

  /**
   * Return a list of all found game (other than steam)
   */
  public async getAllGames() {
    for (const drmName in this.drmList) {
      if (this.drmList.hasOwnProperty(drmName)) {
        const drm = new DRM(drmName);
        await drm.checkInstallation();
        if (drm.isAvailable) {
          this.detectedDrm.push(drm);
        }
      }
    }

    for (const drmIndex in this.detectedDrm) {
      if (this.drmList.hasOwnProperty(drmIndex)) {
        const drm = this.detectedDrm[drmIndex];
        await drm.getGames();
      }
    }

    return new Promise((resolve) => {
      resolve();
    });
  }
}
