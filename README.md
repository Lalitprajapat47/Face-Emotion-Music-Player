# Moodify — Face Expression Driven Music Player

Moodify is a demo web app that detects facial expressions using MediaPipe and suggests/plays songs based on detected moods. It includes a React frontend (Vite) and an Express + MongoDB backend with Redis for token blacklist and ImageKit for storage.


## Features

- Real-time face expression detection using MediaPipe Face Landmarker
- Login / Register with cookie-based JWT authentication
- Song player with mood-based selection
- Image and audio storage integration via ImageKit


## Tech stack

- Frontend: React 19, Vite, Sass
- Backend: Node.js, Express, MongoDB (Mongoose), Redis
- Face detection: @mediapipe/tasks-vision (FaceLandmarker)
- Authentication: JWT in HTTP-only cookie
- Storage: ImageKit
- Other: Axios


## Repo structure

- `Backend/` — Express API, controllers, models, routes
  - `server.js` — app entry
  - `src/app.js` — express app and route wiring
  - `src/controller/` — controllers (auth, song)
  - `src/models/` — Mongoose models (user, song, blacklist)
  - `src/config/` — `database.js`, `cache.js` (Redis)
  - `src/services/` — integrations (ImageKit)

- `Frontend/` — React app
  - `src/features/` — feature folders: `auth`, `home`, `Expressions`, `shared`
  - `src/features/Expressions` — MediaPipe integration and UI
  - `src/features/auth` — login/register, Protected route
  - `src/features/home` — Home page, Player, song context


## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or Atlas)
- Redis instance (local or cloud) — used for token blacklist
- ImageKit account (optional; can skip if not uploading files)


## Environment variables

Create a `.env` in `Backend/` with the following keys (do NOT commit secrets):

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWT tokens
- `REDIS_HOST` — Redis host
- `REDIS_PORT` — Redis port
- `REDIS_PASSWORD` — Redis password (if set)
- `IMAGEKIT_PRIVATE_KEY` — ImageKit private key (optional)


## Install & Run (Development)

Backend:

```bash
cd Backend
npm install
# create .env as described above
npm run dev
```

Frontend (in a separate terminal):

```bash
cd Frontend
npm install
npm run dev
# open http://localhost:5173
```

The backend listens by default on port `3000` and the frontend `5173`.


## API Endpoints (overview)

- `POST /api/auth/register` — register user (body: username, email, password)
- `POST /api/auth/login` — login (returns cookie)
- `GET /api/auth/get-me` — returns current user (protected)
- `GET /api/auth/logout` — clear auth cookie and blacklist token
- `GET /api/songs` and other song endpoints — see `Backend/src/routes/song.routes.js`

All protected routes use the `auth.middleware` which expects a JWT in a `token` cookie.


## Frontend Notes

- The face detection model is loaded from Google Storage via the MediaPipe CDN; the model asset path is configured in `Frontend/src/features/Expressions/utils/utils.js`.
- Camera permission is required; the app attempts to wait for video metadata to be available to avoid MediaPipe errors.
- Routing is defined in `Frontend/src/app.routes.jsx` and the home route is protected; unauthenticated users are redirected to `/login`.


## Troubleshooting

- If you see the app stuck on "Checking authentication…":
  - Ensure the backend is running and `MONGO_URI` + `JWT_SECRET` are correct.
  - Check browser cookies (http-only cookie named `token`) and CORS settings. Backend CORS allows `http://localhost:5173`.
  - Look at the browser console for API 401 responses — this indicates the token is missing or invalid.

- MediaPipe errors (ROI height/width must be > 0): ensure camera permissions are granted and the video element has non-zero dimensions. The frontend includes guards in `init()` and `detect()` to reduce these errors.


## Security notes

- `Backend/.env` should never be committed. Rotate secrets if they were accidentally exposed.
- JWTs are stored in http-only cookies; ensure production uses HTTPS and secure cookie flags.


## Next improvements (ideas)

- Add E2E tests and CI configuration
- Add a small admin UI to manage uploaded songs
- Improve offline fallbacks and error UIs
- Add sample .env.example file with placeholder values


## Contact

If you want me to expand this README with setup screenshots, Docker compose for services (Mongo+Redis), or generate a `.env.example`, say which option and I'll add it.
