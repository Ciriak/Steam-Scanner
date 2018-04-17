import { app, BrowserWindow } from "electron";
import { Steamer } from "./Steamer";
let steamer: any;
app.on("ready", () => {
  steamer = new Steamer();
  steamer.scan();
  setInterval(() => steamer.scan(), steamer.checkInterval);
});
