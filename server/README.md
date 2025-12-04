# LingoLift Server

[English](#english) | [中文](#chinese)

<a name="english"></a>
## English

The LingoLift Server is a Go-based backend that handles data synchronization, user authentication, and serves the web application.

### Prerequisites

- **Go**: 1.21 or later
- **Docker** (Optional, for containerized deployment)

### Running Locally

1.  Navigate to the server directory:
    ```bash
    cd server
    ```

2.  Run the server:
    ```bash
    go run main.go
    ```

The server will start on `http://localhost:8080`.

### Building

```bash
go build -o lingolift-server main.go
```

### Docker Deployment

To deploy using Docker Compose:

```bash
docker-compose up -d --build
```

This will build the server image (including the frontend assets) and start the container.

### API Endpoints

- `POST /api/sync`: Bi-directional synchronization endpoint.
- `POST /api/register`: User registration.
- `POST /api/login`: User login.

---

<a name="chinese"></a>
## 中文 (Chinese)

LingoLift 服务器是一个基于 Go 的后端，负责处理数据同步、用户认证并提供 Web 应用服务。

### 前置要求

- **Go**: 1.21 或更高版本
- **Docker** (可选，用于容器化部署)

### 本地运行

1.  进入 server 目录：
    ```bash
    cd server
    ```

2.  运行服务器：
    ```bash
    go run main.go
    ```

服务器将在 `http://localhost:8080` 启动。

### 构建

```bash
go build -o lingolift-server main.go
```

### Docker 部署

使用 Docker Compose 部署：

```bash
docker-compose up -d --build
```

这将构建服务器镜像（包含前端资源）并启动容器。

### API 端点

- `POST /api/sync`: 双向同步端点。
- `POST /api/register`: 用户注册。
- `POST /api/login`: 用户登录。
