<<<<<<< HEAD
const { app } = require("electron");
const Steamer = require("./Steamer.js");

app.on("ready", () => {
  let steamer = new Steamer();
=======
"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var Steamer_1 = require("./Steamer");
var steamer;
electron_1.app.on("ready", function () {
    steamer = new Steamer_1.Steamer();
>>>>>>> parent of b689592... //WIP JS rework
});
