# LingoLift Desktop

This is the desktop client for LingoLift, built with [Wails 3](https://v3.wails.io/).
It wraps the LingoLift web application (`app`) into a native desktop executable.

## Prerequisites

- Go 1.21+
- Node.js 18+
- Wails 3 CLI (`go install github.com/wailsapp/wails/v3/cmd/wails3@latest`)

## Project Structure

- `frontend/`: Contains the React application (ported from `../app`).
- `main.go`: The Go entry point that creates the window and serves the frontend.
- `Taskfile.yml`: Build tasks configuration.

## Development

To run the application in development mode with hot reloading:

```bash
cd desktop
wails3 task dev
```

This will start the Vite dev server and the Wails application.

## Building

To build the production binary:

```bash
cd desktop
wails3 task build
```

The binary will be output to `bin/lingolift-desktop`.

## Configuration

The application connects to the LingoLift server. By default, it tries `http://localhost:8080`.
You can change the server URL in the application settings (if implemented) or it defaults to localhost.
The frontend code uses `localStorage` to persist the server URL.

## Syncing with App

The `frontend` directory is a copy of the `../app` directory.
If you make changes to the main `app`, you should copy them here:

```bash
rm -rf desktop/frontend/*
cp -r app/* desktop/frontend/
```
(Be careful not to overwrite Wails-specific files if you added any, though currently there are none in `frontend` except standard Vite files).
