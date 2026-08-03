# NOAH

NOAH is a React + TypeScript media workspace prototype built with Vite, MUI, and React Router. Version **5.1.0 — Auth**

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Demo Credentials (Local / Mock Aut)

When `VITE_API_BASE_URL` is not set, the app uses mock authentication. Use these credentials to sign in:

| Field | Value |
|:------|:------|
| **Name** | Aviral Kataria 
| **Role** | Super Admin |
| **Email** | `aviral.kataria@mtxb2b.com` |
| **Password** | `Noah@2026!` |

Protected routes (`/home`, `/media/:mediaId`) require a valid sign in. After login you are redirected to your intended destination.

You can also create a new account at `/signup`. In mock mode, new users are stored in `localStorage`, assigned the **Collaborator** role, and signed in automatically after registration.

> **Note:** These credentials are for local development only. Do not use mock passwords in production.

## Environment Variables

Copy `.env.example` to `.env.local` and configure as needed:

```env
VITE_API_BASE_URL=
VITE_APP_ORIGIN=http://localhost:5173
VITE_API_TIMEOUT_MS=30000
```

| Variable | Description |
|:---------|:------------|
| `VITE_API_BASE_URL` | Backend API base URL. Leave empty to use mock auth and local data. |
| `VITE_APP_ORIGIN` | Public app origin for share link generation. |
| `VITE_API_TIMEOUT_MS` | HTTP request timeout in milliseconds. |

When `VITE_API_BASE_URL` is set, the app expects these auth endpoints:

* `POST /auth/login` → `{ data: { accessToken, user } }`
* `POST /auth/signup` → `{ data: { accessToken, user } }`
* `GET /auth/me` → `{ data: user }`
* `POST /auth/logout`

## Architecture Overview

### Security

* **Input sanitization** — `src/utils/sanitize.ts` normalizes user input before auth/API use.
* **XSS** — No `dangerouslySetInnerHTML` in application code; React escapes rendered text by default.
* **Auth context** — `src/auth/AuthContext.tsx` manages session state.
* **Token handling** — Access tokens live in memory; optional persistence via `sessionStorage` or `localStorage` (Remember me). API client injects `Authorization: Bearer` headers.
* **401 handling** — Global API client clears session on unauthorized responses.

### Routing

* **Protected routes** — `ProtectedRoute` guards `/home` and `/media/*`.
* **Guest route** — Login page redirects authenticated users to dashboard.
* **Code splitting** — Major pages loaded via `React.lazy()` in `src/routes/lazyPages.ts`.
* **Error boundaries** — `RouteErrorBoundary` prevents full app crashes from section errors.
* **404** — Unknown paths render `NotFoundPage`.

### API Layer

```
src/api/
├── client.ts         # Central fetch client, interceptors, error mapping
├── auth.service.ts   # Login, logout, current user
├── types.ts          # DTOs and ApiError
└── index.ts
```

UI components should call services in `src/api/`, not raw `fetch`, so backend integration stays centralized.

## Project Structure

```
src/
├── api/              # HTTP client and service layer
├── auth/             # Auth context, protected routes, session storage
├── components/       # UI components (dashboard, media, settings)
├── config/           # Environment configuration
├── constants/        # App constants, mock credentials, navigation
├── context/          # React context providers
├── data/             # Mock data (prototype)
├── hooks/            # Custom hooks
├── layouts/          # Route layouts
├── pages/            # Page components
├── routes/           # Lazy route definitions
├── styles/           # Global SCSS themes
├── theme/            # MUI theme tokens
├── types/            # TypeScript domain types
└── utils/            # Helpers and local storage utilities
```

## Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Version

Current release: **5.1.0 — Auth** (see `src/constants/appVersion.ts`).
