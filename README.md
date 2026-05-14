# Connectify MERN Chat Application

This workspace contains a React + Vite frontend and a Node.js + Express backend with MongoDB persistence.

## Project structure

- `Frontend/Frontend/` — React app with authentication and chat UI.
- `server/` — Express API and MongoDB models for users, chats, and messages.

## Setup

1. Install server dependencies:
   ```powershell
   cd server
   npm install
   ```

2. Install frontend dependencies:
   ```powershell
   cd ..\Frontend\Frontend
   npm install
   ```

3. Configure backend environment:
   - Copy `server/.env.example` to `server/.env`
   - Update `MONGO_URI` if needed.

## Run

1. Start the backend server:
   ```powershell
   cd server
   npm run dev
   ```

2. Start the frontend app:
   ```powershell
   cd ..\Frontend\Frontend
   npm run dev
   ```

3. Open the Vite app in your browser and register a new user.

## Notes

- The app stores JWT tokens in `localStorage` and fetches chats/messages from the backend.
- The backend seeds sample chats for each newly registered user.
- The backend runs on `http://localhost:8080` by default.
