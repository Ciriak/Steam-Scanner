const fs = require('fs-extra');
const path = require('path');
const drivelist = require('drivelist');
const SteamUser = require('./SteamUser.js');

const possibleSteamLocations = [
  '$drive\\Program Files (x86)\\Steam',
  '$drive\\Programmes\\Steam',
];

function Steamer() {
  this.steamDirectory = null;


  this.log = function (msg) {
    console.log(msg);
  };
  this.error = function (msg) {
    console.error(msg);
  };

  /**
   * Check if steam is installed
   */
  this.checkSteamInstallation = function (steamerInstance) {
    this.addDrivesToPossibleLocations(possibleSteamLocations, function (
      parsedPossibleSteamLocations,
    ) {
      // first we locate steam directory
      for (const loc of parsedPossibleSteamLocations) {
        // try to list all the users in the userdata folder of steam
        try {
          const dir = path.join(loc, 'userdata');
          fs.readdirSync(dir);
          this.steamDirectory = dir.replace('userdata', '');
        } catch (e) {
          continue;
        }
      }
      if (!this.steamDirectory) {
        this.error('ERR_STEAM_NOT_FOUND');
        return;
      }

      steamerInstance.log(`Steam directory located at ${this.steamDirectory}`);
      steamerInstance.log('Looking for steam accounts...');

      const userDirectories = [];
      const usersDir = path.join(this.steamDirectory, 'userdata');
      const items = fs.readdirSync(usersDir);

      // only keep the directories
      for (const dir of items) {
        const dirPath = path.join(usersDir, dir);
        try {
          if (fs.lstatSync(dirPath).isDirectory()) {
            userDirectories.push(dirPath);
          }
        } catch (e) {
          this.error(e);
          continue;
        }
      }

      steamerInstance.log(`${userDirectories.length} user(s) found`);

      for (const userDir of userDirectories) {
        const userId = path.basename(userDir);
        const user = new SteamUser(userId, this);
      }
    });
  }

  /**
   * Take a list of possible location and extend it to all drive available on the machine
   * return the same object with more propertyes
   * $drive is replaced
   */
  this.addDrivesToPossibleLocations = function (possibleLocations, callback) {
    let mountPoints = [];
    const parsedPossibleLocations = [];
    drivelist.list(function (err, drives) {
      for (const drive of drives) {
        for (const mountPoint of drive.mountpoints) {
          mountPoints.push(mountPoint.path);
        }
      }

      for (const mountPoint of mountPoints) {
        for (const loc of possibleLocations) {
          parsedPossibleLocations.push(
            path.normalize(loc.replace('$drive', mountPoint)),
          );
        }
      }

      return callback(parsedPossibleLocations);
    });
  }

  this.checkSteamInstallation(this);
}


module.exports = Steamer;