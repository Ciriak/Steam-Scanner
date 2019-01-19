import { app } from "electron";
import { Scanner } from "./Scanner";
let scanner: Scanner;
app.on("ready", () => {
  scanner = new Scanner();
  scanner.scan();
  // launch a scan every X seconds (wich are specified in the config)
  setInterval(() => scanner.scan(), scanner.checkInterval);
});
