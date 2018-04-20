


# Steam Scanner
![Steam scanner](https://i.imgur.com/TQwOYJC.png =150x)

Get all you games on Steam ! Steam Scanner run as a background process, grab games from others launchers and add them to your Steam library.

|  |
|--|
| Downloads |
| Supported OS |
| Supported DRM |
| Dev prequesites |
| Developping |
| Launch parameters |


## Downloads

### Go to the **[Releases](https://github.com/nj-neer/Steam-Scanner/releases/latest)** section

## Supported OS

For now only **Windows** is supported, but Linux on Mac version is planned !

## Supported DRM

|DRM|Supported  |
|--|--|
| ![](https://i.imgur.com/C0PYnQH.png =18x) Uplay | ✔️ |
| ![](https://i.imgur.com/0iLlyMK.png =18x) Origin | ✔️ |
| ![](https://i.imgur.com/ffu3VTv.png =18x) Blizzard Launcher | 🔁 WIP |
| ![](https://i.imgur.com/ES8Pr1w.png =18x) GOG Galaxy | ❌ |
| ![](https://i.imgur.com/zN8Cdvs.png =18x) Twitch DA | ❌ |


## Dev Prerequisites

* [Yarn](https://yarnpkg.com/lang/en/docs/install)  (using npm cause issues with native dependencies building)

* [Gulp](https://gulpjs.com/)
* [Electron](https://electronjs.org/)

*For windows, as admin*
```
npm install --global --production windows-build-tools
```

## Developping

Install the dependencies and generate the dist folder

```
yarn
```

Start the watcher

```
yarn run dev
```

### Launching the app (dev mode)

```
electron dist/app.js
```

### Building

```
yarn run build
```

**note :** Yarn doesn't show detailled error messages, use the vanilla command (ex: electron-builder") to display the full error if the build fail

### Deploy a release

**note** You need to create a file named **.gh-token** with the Github release token in it

```
yarn run deploy
```

## Launch parameters

The following launch parameters are available :

|  |  |
|--|--|
| - - clean | Clear the saved config and all shortcuts saved on Steam |
| - - debug | Show additionnal outputs in the console (like updater logs) |
