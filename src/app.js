const { app } = require("electron");
const Steamer = require("./Steamer.js");

app.on("ready", () => {
  let steamer = new Steamer();
});
