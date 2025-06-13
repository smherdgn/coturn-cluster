
# NextRTC Video Call Application

This is a secure WebRTC video calling application built with Next.js, Socket.io, and JWT authentication. It now exposes several mobile-friendly API routes and logging utilities for a React Native client.

## Features

- JWT-based authentication (access and refresh tokens)
- HTTP-only cookies for secure token storage
- Protected routes using Next.js Middleware
- Socket.io for WebRTC signaling
- WebSocket authentication using JWT
- Peer-to-peer video/audio streaming using `RTCPeerConnection`
- Join rooms by Room ID
- Basic UI with Login, Room Entry, and Call pages
- Mute/unmute audio, enable/disable video controls
- Logout functionality
- Toast notifications for key events
- Consent management via `/api/consent`
- TURN-only ICE configuration at `/api/webrtc-config`
- Mobile version check at `/api/version`
- Secure file uploads through `/api/upload`
- Health check endpoint `/api/health`
- Rate limiting on login and socket connections
- Additional Socket.IO events: `chat-message`, `file-meta`, and `reconnect`
- Server-side logging via `logEvent` with optional Sentry support

## Tech Stack

- Next.js (App Router for UI, Pages Router for API)
- React 18
- TypeScript
- Socket.io & Socket.io-client
- jsonwebtoken & jose (for JWT handling)
- cookie & js-cookie (for cookie management)
- Tailwind CSS for styling
- Lucide React for icons

## Project Structure

- `src/app/`: Frontend pages and components (App Router)
  - `login/`: Login page
  - `room-entry/`: Page to enter Room ID
  - `call/[roomId]/`: Video call page
  - `components/`: Reusable UI components
  - `contexts/`: React Context (e.g., `AuthContext`)
- `src/pages/api/`: Backend API routes (Pages Router)
  - `login.ts`: Login endpoint
  - `refresh.ts`: Refresh token endpoint
  - `logout.ts`: Logout endpoint
  - `socketio.ts`: Socket.IO signaling server
- `src/lib/`: Shared utilities (e.g., JWT helpers)
- `src/types/`: TypeScript type definitions
- `src/middleware.ts`: Next.js middleware for route protection
- `public/`: Static assets (if any)
- `.env.example`: Example environment variables
- `tailwind.config.js`, `postcss.config.js`: Tailwind CSS configuration

## API Endpoints

- `POST /api/consent` – record user consent flags with hashed user ID and IP
- `GET /api/webrtc-config` – return TURN-only ICE server details
- `GET /api/version` – return the latest mobile app version
- `GET /api/health` – simple health check for uptime monitoring
- `POST /api/upload` – authenticated file uploads (PDF, PNG, JPEG) stored in `uploads/`

## Setup and Installation

1.  **Clone the repository (or extract the provided files).**

2.  **Install dependencies:**
    Open your terminal in the project root directory and run:
    ```bash
    npm install
    # or
    yarn install
    ```
    This will install packages like `next`, `react`, `socket.io`, `jsonwebtoken`, `tailwindcss`, etc., as defined in `package.json`.

3.  **Set up environment variables:**
    Create a `.env.local` file in the project root by copying `.env.example`.
    ```bash
    cp .env.example .env.local
    ```
    Open `.env.local` and set the following variables:
    ```env
    JWT_SECRET="your-super-secure-and-long-jwt-secret-key-at-least-32-characters"
    NEXT_PUBLIC_APP_URL="http://localhost:3000" # Your local development URL
    NEXT_PUBLIC_SOCKET_PATH="/api/socketio" # Should match server setup
    NEXT_PUBLIC_SUPABASE_URL=""         # Optional Supabase logging
    NEXT_PUBLIC_SUPABASE_ANON_KEY=""
    SUPABASE_SERVICE_ROLE_KEY=""
    SENTRY_DSN=""                        # Optional error reporting
    ```
    Replace `"your-super-secure-and-long-jwt-secret-key-at-least-32-characters"` with a strong, unique secret key.
     The admin email used for the dashboard is stored in the Supabase table `app_config` under the key `admin_email`.
 

## Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    This will start the Next.js development server, typically on `http://localhost:3000`.

2.  **Open the application in your browser:**
    Navigate to `http://localhost:3000`.

## How to Use

1.  You will be redirected to the **Login page** (`/login`).
2.  Use the demo credentials to log in:
    -   Email: `user@example.com`
    -   Password: `password123`
3.  Upon successful login, you'll be redirected to the **Room Entry page** (`/room-entry`).
4.  Enter any **Room ID** (e.g., `test-room123`) and click "Join Room".
5.  You will be taken to the **Call page** (`/call/[your-room-id]`).
    -   Allow browser permissions for camera and microphone when prompted.
6.  To test with another user:
    -   Open a new browser window (preferably an incognito window or a different browser to simulate a different user session).
    -   Repeat steps 1-4, joining the **same Room ID**.
7.  Video and audio communication should establish between the two users.
8.  Use the on-screen controls to mute/unmute audio, toggle video, or leave the call.
9.  The "Logout" button is available on the Room Entry and Call pages.

## Notes

-   This application uses public STUN servers (`stun:stun.l.google.com:19302`) for NAT traversal. Mobile clients can fetch TURN-only details from `/api/webrtc-config`.
-   The Socket.IO server is integrated into Next.js using the Pages Router API (`src/pages/api/socketio.ts`).
-   Error handling and UI are basic. For production, consider more comprehensive error management and UI/UX improvements.
-   JWT refresh token logic is implemented in the middleware and `/api/refresh` endpoint to maintain user sessions.
-   WebSocket authentication ensures only logged-in users can connect to the signaling server.
-   Toast notifications provide feedback for actions like login, WebSocket connection status, and user joining/leaving rooms.
-   Audit logs are written to `logs/events.log` via the `logEvent` helper.
-   Uploaded files are saved under `uploads/` and served at `/uploads/<filename>`.

Enjoy your secure video calling experience!
