# Bookify

A book library with playlists, ratings, profiles and reader following.

## Run with Docker

Use Docker for both development and production workflows. Email verification and password reset are turned off by default; see [DEPLOYMENT.md](DEPLOYMENT.md) to enable them once an SMTP server is available.

- `make dev` starts the local hot-reload app at `http://127.0.0.1:5173`.
- `make dev-detach` starts local development in the background.
- `make dev-down` stops local development.
- `make lint` runs ESLint in Docker.
- `make test` runs the API tests in Docker (`npm test` without Docker).
- `make build` runs the production frontend build in Docker.
- `make prod` builds and starts the production container.
- `make prod-logs` follows production logs.

Local Docker development stores test data in the `bookify_dev_data` volume. Production stores account and library data in the `bookify_data` volume.

Node.js 24 or newer is still supported for direct local work with `npm ci` and `npm run dev`, but Docker/Make is the preferred path. The app opens at `http://localhost:5173`; the same command also starts the account API. Local account data is stored in `data/bookify.sqlite`, which is ignored by Git. Server deployment instructions are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Project layout

- `src/App.jsx`: session loading, guest mode and the sign-in dialog.
- `src/lib/router.js`: page URLs (`/discover`, `/library/:id`, `/readers/:id`, …).
- `src/BookifyApp.jsx`: page selection and shared actions. Guests can browse; actions that need an account open the sign-in dialog.
- `src/pages/`: complete screens, including books, profile and readers.
- `src/components/`: reusable book, playlist and navigation elements.
- `src/hooks/`: library persistence, book search and book details.
- `src/lib/`: API requests, book catalog helpers and local import.
- `src/styles/`: styles grouped by page and component area.
- `server/index.js`: HTTP entry point.
- `server/api.js`, `auth.js`, `db.js`, `http.js`: routes, account logic, database and static files.
- `server/api.test.js`: API tests that start the real server against a temporary database.
