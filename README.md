# Steam Scanner

Get all you games on Steam ! Steam Scanner run as a background process, grab games from others launchers and automaticly add them to your Steam library.

## Prerequisites

* Yarn (using npm cause issues with native dependencies building)

For windows, as admin

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
