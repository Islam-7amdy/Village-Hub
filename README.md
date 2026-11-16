# Noqbas Village Services Hub (نقباس)

A web platform for the residents of Noqbas village and neighbouring villages. It connects residents with local service providers (doctors, pharmacies, restaurants, groceries, technicians, rides, tutoring, charities and more) and includes booking, a shopping cart, order tracking, payment by InstaPay or cash on delivery, and dedicated dashboards for providers and administrators.

**Stack:** React + Vite + Express + Firebase (Firestore and Authentication), with an optional Gemini-powered village assistant.

## Prerequisites

- **Node.js** 20 or newer (22 recommended)
- **npm** (or **bun**)
- A **Firebase** project with **Firestore Database** and **Authentication** enabled (project settings live in `firebase-applet-config.json`)

## Quick start: run it locally and see it

```bash
npm install            # or: bun install
cp .env.example .env   # all values are optional for a first run
npm run dev
```

Then open **http://localhost:3000** in your browser.

In development mode (`npm run dev`) the app shows a **demo accounts** panel in the sign-in dialog, so you can explore without receiving an SMS code. Sign in with a phone number and the password `123456`:

| Phone | Role |
| --- | --- |
| `01011111111` | Resident (Test User 1) |
| `01022222222` | Resident (Test User 2) |
| `01033333333` | Provider (approved doctor) |
| `01044444444` | Provider (pending technician) |

Demo accounts and the sample village data exist only in development builds (`import.meta.env.DEV`). They are not included in the production bundle.

Real sign-up uses phone number verification (SMS code) through Firebase. For that to work on `localhost`, make sure `localhost` is listed under Firebase Console → Authentication → Settings → Authorized domains.

## Environment variables

Copy `.env.example` to `.env` and fill in what you need:

- `PORT`: server port (default `3000`)
- `GEMINI_API_KEY`: Gemini API key for the village assistant (optional; without it the assistant returns a built-in fallback reply)
- `GEMINI_MODEL`: Gemini model used by the assistant (default `gemini-4-hydrogen`). Check the name against Google's official model list. The server prints the model at startup, and if the name is wrong the assistant silently falls back to the canned reply and the error appears in the server log.
- `APP_URL`: public URL of the app
- `VITE_RECAPTCHA_SITE_KEY`: reCAPTCHA v3 site key used to enable Firebase App Check in the browser (optional)
- `FIREBASE_SERVICE_ACCOUNT_JSON`: Firebase Admin SDK service account as JSON (optional; enables full token verification, permanent user deletion from Auth, and the ban check before SMS is sent). `GOOGLE_APPLICATION_CREDENTIALS` also works.

## Production

1. Build the client and bundle the server:
   ```bash
   npm run build
   ```
   This creates the `dist/` folder and the bundled server file `server.js` (which is git-ignored).

2. Start the production server:
   ```bash
   npm start
   ```
   It runs with `NODE_ENV=production`, serves the static files from `dist/`, and exposes the API routes `/api/village-assistant`, `/api/auth/check-ban` and `/api/admin/delete-user`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (`tsx server.ts`: Express with Vite middleware) |
| `npm run build` | Build the client (`vite build`) and bundle the server (`esbuild`) |
| `npm start` | Run the production build (`NODE_ENV=production node server.js`) |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run lint:eslint` | Lint with ESLint |
| `npm test` | Run unit tests (`tsx --test tests/*.test.ts`) |
| `npm run clean` | Delete `dist/` and `server.js` (works on Windows, Linux and macOS) |

## Deploying Firestore rules and production security setup (Firebase and Google Cloud Console)

1. **Deploy the security rules (`firestore.rules`):**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Grant admin access (`/admins/{uid}`):**
   There are no hard-coded admin emails in the code. To make someone an administrator, create a document in a Firestore collection named `admins` whose document ID is that person's Firebase Authentication `uid` (the document can contain something like `{ active: true }`).

3. **Firebase Admin SDK on the server (`FIREBASE_SERVICE_ACCOUNT_JSON`):**
   Set `FIREBASE_SERVICE_ACCOUNT_JSON` (or `GOOGLE_APPLICATION_CREDENTIALS`) so the server can:
   - Permanently delete a user from Firebase Authentication and Firestore when an admin deletes them (`/api/admin/delete-user`). It also deletes the user's ads and analytics events and anonymizes their reviews and orders. Orders are kept for financial settlement, but without the customer's name, phone number or address.
   - Quickly check whether a phone number is banned before an SMS verification code is sent (`/api/auth/check-ban`).

4. **Protect the Firebase API key and SMS quota (required in the console):**
   - **Restrict the browser key (HTTP referrers):** Google Cloud Console → APIs & Services → Credentials → restrict the browser key to your approved site domains only (for example `noqbas.example.com/*`).
   - **Enable Firebase App Check:** register your site with reCAPTCHA v3 in Firebase Console → App Check, set `VITE_RECAPTCHA_SITE_KEY` in the environment, then turn on enforcement for Firestore and Authentication.
   - **Limit SMS regions:** Firebase Console → Authentication → Settings → SMS region policy → choose **Allow only** and select Egypt (`+20`) to prevent international SMS abuse from draining your quota.
