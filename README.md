# LingoLift

[English](#english) | [中文](#chinese)

<a name="english"></a>
## English

LingoLift is a comprehensive language learning platform featuring a mobile-first web app, a desktop client, and a synchronization server.

### Project Structure

- **`app/`**: The mobile-first web application (React + TypeScript + Vite).
- **`server/`**: The backend server (Go + Gin + GORM + SQLite). Handles synchronization and serves the web app.
- **`desktop/`**: The desktop client (Wails 3 + React). Wraps the `app` code into a native desktop application.

### Getting Started

Please refer to the README in each directory for specific instructions:

- [Mobile/Web App Documentation](app/README.md)
- [Server Documentation](server/README.md)
- [Desktop Client Documentation](desktop/README.md)

---

<a name="chinese"></a>
## 中文 (Chinese)

LingoLift 是一个全面的语言学习平台，包含移动端优先的 Web 应用、桌面客户端和同步服务器。

### 项目结构

- **`app/`**: 移动端优先的 Web 应用 (React + TypeScript + Vite)。
- **`server/`**: 后端服务器 (Go + Gin + GORM + SQLite)。处理数据同步并提供 Web 服务。
- **`desktop/`**: 桌面客户端 (Wails 3 + React)。将 `app` 代码封装为原生桌面应用。

### 快速开始

请参考各个目录下的 README 获取详细说明：

- [移动端/Web 应用文档](app/README.md)
- [服务器文档](server/README.md)
- [桌面客户端文档](desktop/README.md)
