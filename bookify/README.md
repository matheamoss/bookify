# Bookify

A book library with playlists, ratings, profiles and reader following.

## Run locally

Use Node.js 24 or newer. Install dependencies with `npm ci`, then run `npm run dev`. The app opens at `http://localhost:5173`; the same command also starts the account API. Local account data is stored in `data/bookify.sqlite`, which is ignored by Git.

Use `npm run build` to create the production site and `npm run lint` to check the code. Server deployment instructions are in [DEPLOYMENT.md](DEPLOYMENT.md).

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
