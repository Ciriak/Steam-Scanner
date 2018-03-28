const { app, BrowserWindow } = require('electron');
const Steamer = require('./Steamer.js');

let steamer;
app.on('ready', () => {
  steamer = new Steamer();
});
