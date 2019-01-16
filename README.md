<center>
    <h1>Steam Scanner</h1>
    <img src="https://i.imgur.com/TQwOYJC.png" width="150px" height="150px">

[![GitHub version](https://badge.fury.io/gh/nj-neer%2FSteam-Scanner.svg)](https://github.com/nj-neer/Steam-Scanner/releases/latest)

[![Build status](https://ci.appveyor.com/api/projects/status/la08lmcifr0q6r9q?svg=true)](https://ci.appveyor.com/project/Cyriaqu3/steam-scanner)

<a href="https://codeclimate.com/github/nj-neer/Steam-Scanner/maintainability"><img src="https://api.codeclimate.com/v1/badges/6e18e92248d930d4d7d5/maintainability" /></a>

</center>

Get all you games on Steam ! Steam Scanner run as a background process, grab games from others launchers and add them to your Steam library.

|          In system tray           |          Result in Steam           |
| :-------------------------------: | :--------------------------------: |
| ![](./src/assets/screen-tray.png) | ![](./src/assets/screen-steam.png) |

| Table of contents                        |
| ---------------------------------------- |
| [Downloads](#downloads)                  |
| [Supported OS](#supported-os)            |
| [Supported Launcher](#supported-drm)     |
| [Dev prerequisites](#dev-prerequisites)  |
| [Developping](#developping)              |
| [Launch parameters](#launch-parameters)  |
| [Launcher config file](#drm-config-file) |
| [Known bugs](#known-bugs)                |

## Downloads

### Go to the **[Releases](https://github.com/nj-neer/Steam-Scanner/releases/latest)** section

## Supported OS

For now only **Windows** is supported

## Supported Launcher

| Launcher                                                                          | Supported |
| --------------------------------------------------------------------------------- | --------- |
| <img src="https://i.imgur.com/C0PYnQH.png" width="18px" height="18px"> Uplay      | ✔️        |
| <img src="https://i.imgur.com/0iLlyMK.png" width="18px" height="18px"> Origin     | ✔️        |
| <img src="https://i.imgur.com/ffu3VTv.png" width="18px" height="18px"> BattleNet  | 🔁 WIP    |
| <img src="https://i.imgur.com/ES8Pr1w.png" width="18px" height="18px"> GOG Galaxy | ❌        |
| <img src="https://i.imgur.com/zN8Cdvs.png" width="18px" height="18px"> Twitch DA  | ❌        |
| <img src="https://i.imgur.com/KUhFAXu.png"  width="18px" height="18px"> MS Store  | ❌        |

## Dev Prerequisites

- [Yarn](https://yarnpkg.com/lang/en/docs/install) (using npm cause [issues with native dependencies building](https://github.com/electron-userland/electron-builder/issues/1147#issuecomment-276284477))

- [Gulp](https://gulpjs.com/)
- [Electron](https://electronjs.org/)
- [Python 2.7](https://www.python.org/downloads/)

_For windows, as admin_

```
npm install --global --production windows-build-tools
```

## Developping

Install the dependencies and generate the dist folder

```
npm i
```

Start the watcher

```
npm run dev
```

### Launching the app (dev mode)

```
electron dist/app.js
```

### Building

```
npm run build
```

## Launch parameters

The following launch parameters are available :

|           |                                                             |
| --------- | ----------------------------------------------------------- |
| - - clean | Clear the saved config and all shortcuts saved on Steam     |
| - - debug | Show additionnal outputs in the console (like updater logs) |

## Launcher config files

_/src/library/launchers/**#launcher-name#**.json_

#### Launcher Config file properties

|        property         |       type        | default | required | notes                                                                                                                   |
| :---------------------: | :---------------: | :-----: | :------: | ----------------------------------------------------------------------------------------------------------------------- |
|          name           |      string       |         |   true   | Name of the Launcher                                                                                                    |
|       binaryName        | string (fileName) |         |   true   | Name of the executable of the Launcher                                                                                  |
| binaryPossibleLocations |  string(path)[]   |         |   true   | Array of path where **binaryName** may be found, use the **\$drive** string to tell the scanner to search on each drive |

## Game config files

_/src/library/games/**#game-name#**.json_

#### Game config file properties

|  property  |   type   | default | required | notes                                                                  |
| :--------: | :------: | :-----: | :------: | ---------------------------------------------------------------------- |
|    name    |  string  |         |   true   | Name of the game                                                       |
|  binaries  | string[] |         |   true   | List of possible binaries file name (ex : **Overwatch Launcher.exe** ) |
|  launcher  |  string  |         |  false   | name of the launcher associated with this game (ex: **Uplay**)         |
| folderName |  string  |         |  false   | Name of the game folder, **name** will be used if not given            |
