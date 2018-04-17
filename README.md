# Steamer

Get all you games on Steam ! Steamer is an Electron app that grab games from others launchers and automaticly add them to Steam.

## Prerequisites

* Yarn

(as admin)

```
npm install --global --production windows-build-tools
```

## Developping

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

**note :** Yarn doesn't show detailled error message, use the vanilla command (ex: electron-builder") to display the full error when the build fail

## CLI

_--clean_ Clear the saved config and all shortcuts saved on Steam
