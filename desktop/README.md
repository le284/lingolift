# LingoLift Desktop

[English](#english) | [中文](#chinese)

<a name="english"></a>
## English

This is the desktop client for LingoLift, built with [Wails 3](https://v3.wails.io/). It wraps the LingoLift web application (`app`) into a native desktop executable.

### Prerequisites

- **Go**: 1.21 or later
- **Node.js**: 18 or later
- **Wails 3 CLI**: `go install github.com/wailsapp/wails/v3/cmd/wails3@latest`

### Development

To run the application in development mode with hot reloading:

```bash
cd desktop
wails3 task dev
```

This will start the Vite dev server and the Wails application.

### Building

To build the production binary:

```bash
cd desktop
wails3 task build
```

The binary will be output to `bin/LingoLift`.

### Packaging

To create an installable package (e.g., `.app` on macOS):

```bash
cd desktop
wails3 task package
```

The package will be output to `bin/LingoLift.app`.

### Syncing with App

The `frontend` directory is a copy of the `../app` directory. If you make changes to the main `app`, you should copy them here:

```bash
rm -rf desktop/frontend/*
cp -r app/* desktop/frontend/
```

---

<a name="chinese"></a>
## 中文 (Chinese)

这是 LingoLift 的桌面客户端，使用 [Wails 3](https://v3.wails.io/) 构建。它将 LingoLift Web 应用 (`app`) 封装为原生桌面可执行文件。

### 前置要求

- **Go**: 1.21 或更高版本
- **Node.js**: 18 或更高版本
- **Wails 3 CLI**: `go install github.com/wailsapp/wails/v3/cmd/wails3@latest`

### 开发

在开发模式下运行应用（支持热重载）：

```bash
cd desktop
wails3 task dev
```

这将启动 Vite 开发服务器和 Wails 应用。

### 构建

构建生产环境二进制文件：

```bash
cd desktop
wails3 task build
```

二进制文件将输出到 `bin/LingoLift`。

### 打包

创建可安装的包（例如 macOS 上的 `.app`）：

```bash
cd desktop
wails3 task package
```

包将输出到 `bin/LingoLift.app`。

### 与 App 同步

`frontend` 目录是 `../app` 目录的副本。如果您对主 `app` 进行了更改，应将其复制到此处：

```bash
rm -rf desktop/frontend/*
cp -r app/* desktop/frontend/
```
