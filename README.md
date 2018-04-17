# Steam Scanner

Get all you games on Steam ! Steam Scanner run as a background process, grab games from others launchers and automaticly add them to Steam.

## Prerequisites

* Yarn (using npm cause issue with native dependencies building)

For windows, as admin

```
npm install --global --production windows-build-tools
```

## Developping

```
yarn
```

Will install the dependencies and generate the dist folder

```
yarn run dev
```

Will start the watcher

## Launching the app (dev mode)

```
electron dist/app.js
```

## Building

```
yarn run build
```

**note :** Yarn doesn't show detailled error message, use the vanilla command (ex: electron-builder") to display the full error if the build fail

## Available launch parameters

_--clean_ Clear the saved config and all shortcuts saved on Steam
