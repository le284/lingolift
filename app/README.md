# LingoLift App

[English](#english) | [中文](#chinese)

<a name="english"></a>
## English

This is the mobile-first web application for LingoLift, built with React, TypeScript, and Vite. It uses IndexedDB for offline storage and synchronizes with the LingoLift Server.

### Prerequisites

- **Node.js**: 18 or later

### Development

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

The app will start on `http://localhost:5173`.

### Building

To build for production:

```bash
npm run build
```

The output will be in the `dist` directory.

### Configuration

The app connects to the server URL stored in `localStorage` (key: `lingolift_server_url`). Default is `http://localhost:8080`.

---

<a name="chinese"></a>
## 中文 (Chinese)

这是 LingoLift 的移动端优先 Web 应用，使用 React, TypeScript 和 Vite 构建。它使用 IndexedDB 进行离线存储，并与 LingoLift 服务器同步。

### 前置要求

- **Node.js**: 18 或更高版本

### 开发

1.  安装依赖：
    ```bash
    npm install
    ```

2.  运行开发服务器：
    ```bash
    npm run dev
    ```

应用将在 `http://localhost:5173` 启动。

### 构建

构建生产环境版本：

```bash
npm run build
```

输出将位于 `dist` 目录。

### 配置

应用连接到存储在 `localStorage` 中的服务器 URL（键名：`lingolift_server_url`）。默认为 `http://localhost:8080`。