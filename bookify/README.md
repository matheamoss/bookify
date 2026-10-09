# Bookify

A book library with playlists, ratings, profiles and reader following.

## Run with Docker

Use Docker for both development and production workflows.

- `make dev` starts the local hot-reload app at `http://127.0.0.1:5173`.
- `make dev-detach` starts local development in the background.
- `make dev-down` stops local development.
- `make lint` runs ESLint in Docker.
- `make build` runs the production frontend build in Docker.
- `make prod` builds and starts the production container.
- `make prod-logs` follows production logs.

Local Docker development stores test data in the `bookify_dev_data` volume. Production stores account and library data in the `bookify_data` volume.

Node.js 24 or newer is still supported for direct local work with `npm ci` and `npm run dev`, but Docker/Make is the preferred path. Server deployment instructions are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Project layout

- `src/App.jsx`: session loading and sign-in state.
- `src/BookifyApp.jsx`: page selection and shared actions.
- `src/pages/`: complete screens, including books, profile and readers.
- `src/components/`: reusable book, playlist and navigation elements.
- `src/hooks/`: library persistence, book search and book details.
- `src/lib/`: API requests, book catalog helpers and local import.
- `src/styles/`: styles grouped by page and component area.
- `server/index.js`: HTTP entry point.
- `server/api.js`, `auth.js`, `db.js`, `http.js`: routes, account logic, database and static files.
