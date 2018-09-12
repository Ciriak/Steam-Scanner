import { app } from "electron";
import { Scanner } from "./Scanner";
let scanner: any;
app.on("ready", () => {
  scanner = new Scanner();
  scanner.scan();
  setInterval(() => scanner.scan(), scanner.checkInterval);
});
