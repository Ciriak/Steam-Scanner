"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var Steamer_1 = require("./Steamer");
var steamer;
electron_1.app.on("ready", function () {
    steamer = new Steamer_1.Steamer();
    steamer.scan();
    setInterval(function () { return steamer.scan(); }, steamer.checkInterval);
});
