"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var Scanner_1 = require("./Scanner");
var scanner;
electron_1.app.on("ready", function () {
    scanner = new Scanner_1.Scanner();
    scanner.scan();
    setInterval(function () { return scanner.scan(); }, scanner.checkInterval);
});
