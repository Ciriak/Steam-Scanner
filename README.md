# Steam Scanner

<img src="https://i.imgur.com/TQwOYJC.png" width="150px" height="150px">

[![GitHub version](https://badge.fury.io/gh/nj-neer%2FSteam-Scanner.svg)](https://github.com/nj-neer/Steam-Scanner)
[![Build status](https://ci.appveyor.com/api/projects/status/la08lmcifr0q6r9q?svg=true)](https://ci.appveyor.com/project/Cyriaqu3/steam-scanner)

Get all you games on Steam ! Steam Scanner run as a background process, grab games from others launchers and add them to your Steam library.

| Table of contents                       |
| --------------------------------------- |
| [Downloads](#downloads)                 |
| [Supported OS](#supported-os)           |
| [Supported DRM](#supported-drm)         |
| [Dev prerequisites](#dev-prerequisites) |
| [Developping](#developping)             |
| [Launch parameters](#launch-parameters) |

## Downloads

### Go to the **[Releases](https://github.com/nj-neer/Steam-Scanner/releases/latest)** section

## Supported OS

For now only **Windows** is supported, but Linux and Mac version is planned !

## Supported DRM

| DRM                                                                               | Supported |
| --------------------------------------------------------------------------------- | --------- |
| <img src="https://i.imgur.com/C0PYnQH.png" width="18px" height="18px"> Uplay      | ✔️        |
| <img src="https://i.imgur.com/0iLlyMK.png" width="18px" height="18px"> Origin     | ✔️        |
| <img src="https://i.imgur.com/ffu3VTv.png" width="18px" height="18px"> BattleNet  | 🔁 WIP    |
| <img src="https://i.imgur.com/ES8Pr1w.png" width="18px" height="18px"> GOG Galaxy | ❌        |
| <img src="https://i.imgur.com/zN8Cdvs.png" width="18px" height="18px"> Twitch DA  | ❌        |
| <img src="https://i.imgur.com/KUhFAXu.png"  width="18px" height="18px"> MS Store  | ❌        |

## Dev Prerequisites

* [Yarn](https://yarnpkg.com/lang/en/docs/install) (using npm cause issues with native dependencies building)

* [Gulp](https://gulpjs.com/)
* [Electron](https://electronjs.org/)
* [Python 2.7](https://www.python.org/downloads/)

_For windows, as admin_

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

|           |                                                             |
| --------- | ----------------------------------------------------------- |
| - - clean | Clear the saved config and all shortcuts saved on Steam     |
| - - debug | Show additionnal outputs in the console (like updater logs) |
