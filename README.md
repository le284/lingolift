# LingoLift

**LingoLift** is a modern, offline-first language learning application designed to help you master new vocabulary and concepts through **Spaced Repetition (SRS)**. 

Built with a robust **Go** backend and a responsive **React** frontend, LingoLift ensures you can study anytime, anywhere—even without an internet connection—while keeping your progress synchronized across devices.

## 🚀 Key Features

*   **🧠 Spaced Repetition System (SRS):** Implements the proven **SuperMemo-2 (SM-2)** algorithm to schedule reviews at the optimal time for long-term retention.
*   **⚡️ Offline-First Architecture:** The app works fully offline using a local database (IndexedDB). Your progress, new cards, and edits automatically sync with the server when you're back online.
*   **📚 Multimedia Lessons:** Create comprehensive lessons with support for **Audio** (MP3) and **PDF** attachments.
*   **📝 Rich Text Flashcards:** Full **Markdown** support for flashcards, allowing you to use bolding, lists, code blocks, and more in your study materials.
*   **🏷️ Tagging System:** Organize your lessons and vocabulary with a flexible tag system. Filter by tags on the homepage and vocabulary list.
*   **🔄 Seamless Synchronization:** Robust sync engine handles data merging, conflict resolution (server-wins strategy), and soft deletions.
*   **🌍 Multi-Language UI:** Native support for **English** and **Chinese (Simplified)** interfaces.
*   **📱 Responsive Design:** Optimized for both desktop and mobile web experiences.

## 🛠️ Tech Stack

### Frontend (Client App & Server Web UI)
*   **Framework:** React 18, TypeScript
*   **Build Tool:** Vite
*   **Styling:** TailwindCSS, Lucide React (Icons)
*   **Local Storage:** IndexedDB (Native API)
*   **State Management:** React Hooks & Context API

### Backend (Server)
*   **Language:** Go (Golang)
*   **Web Framework:** Gin
*   **ORM:** GORM
*   **Database:** SQLite (Embedded, zero-config)
*   **Authentication:** JWT (JSON Web Tokens)

## 📂 Project Structure

*   **`app/`**: The standalone client application (PWA-ready). This is the primary interface for users, featuring offline capabilities and sync logic.
*   **`server/`**: The backend API server written in Go.
    *   **`server/web/`**: The web interface served directly by the Go server (embedded). It provides a browser-based way to manage content and view progress.
    *   **`server/internal/`**: Core backend logic (Handlers, Models, DB, Middleware).
    *   **`server/uploads/`**: Directory for storing uploaded lesson assets (Audio/PDF).

## 🏁 Getting Started

### Prerequisites
*   **Node.js** (v18+)
*   **Go** (v1.20+)
*   **Docker** (Optional, for containerized deployment)

### 1. Running the Server

The server handles API requests, data synchronization, and serves the web UI.

```bash
cd server

# Install dependencies
go mod download

# Run the server (default port: 8080)
go run main.go
```

The server will be available at `http://localhost:8080`.

### 2. Running the Client App (Development)

The client app is the main study interface.

```bash
cd app

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### 3. Using Docker (Recommended for Deployment)

You can deploy the entire stack using Docker Compose.

```bash
cd server
docker-compose up -d
```

## 📖 Usage Guide

1.  **Register/Login:** Create an account on the server or log in.
2.  **Create a Lesson:**
    *   Go to the "Create" page.
    *   Enter a title and description.
    *   (Optional) Upload an audio file or PDF reference.
    *   Add Flashcards (Front/Back). You can use Markdown!
3.  **Study:**
    *   Click on a lesson to review cards specific to that lesson.
    *   Or click **"Review All"** on the homepage to start a global review session based on SRS priority.
4.  **Sync:**
    *   Click the **Sync** button (refresh icon) in the header to synchronize your local progress with the server.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
