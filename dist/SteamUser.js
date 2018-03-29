var fs = require('fs-extra');
var path = require('path');
function SteamUser(userId, steamerInstance) {
    this.userId = userId;
    this.steamerInstance = steamerInstance;
    this.directory = null;
    this.shortcutsFilePath = null;
    this.steamerInstance = null;
    this.initUser = function (userId, steamer) {
        this.directory = path.join(this.steamerInstance.steamDirectory, "userdata", this.userId);
        this.shortcutsFilePath = path.join(this.directory, "config", "shortcuts.vdf");
    }
}

module.exports = SteamUser;