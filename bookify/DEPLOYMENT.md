# Bookify on a server

Bookify runs as one container: the website, account API, and SQLite database. The named Docker volume keeps accounts, playlists, and ratings when the container is rebuilt.

## Start With Make

1. Copy this project to your server.
2. Point your HTTPS reverse proxy at `127.0.0.1:3000`.
3. Run `make prod` from this directory.

Useful production commands:

- `make prod` builds and starts the production container in the background.
- `make prod-build` builds the production image.
- `make prod-down` stops the production container.
- `make prod-logs` follows logs from the production container.

The app binds to `127.0.0.1:3000` on the host by default. Set `BOOKIFY_PORT` if port 3000 is occupied. Set `BOOKIFY_BIND=0.0.0.0` only when you deliberately want Docker to expose the port externally. Keep `COOKIE_SECURE=true` when visitors use HTTPS. For local HTTP testing only, set `COOKIE_SECURE=false` before starting Compose.

Check the container with `docker compose ps` or `make prod-logs`. Back up the `bookify_data` volume; it contains user accounts and libraries. Do not run `docker compose down -v` unless you intend to erase it.

## Local Docker Development

Use `make dev` to start the development container at `http://127.0.0.1:5173`. This runs Vite with hot reload and the account API in the same container.

Useful development commands:

- `make dev-detach` starts local development in the background.
- `make dev-down` stops local development.
- `make dev-logs` follows local development logs.
- `make dev-shell` opens a shell inside the development container.
- `make clean-dev-data` removes the local development database volume.

The local development test user is enabled only in development:

- Email: `test@bookify.local`
- Password: `Testbruker123!`

Registration uses name, email, and a password of at least 12 characters. Passwords are hashed; session cookies are HTTP-only. This version has no email verification or password reset, so add those before opening registration to a large public audience.

Readers can search public profiles, follow each other, and view public playlists, saved books, and ratings. Email addresses remain private. Existing accounts are private after the database migration; their owners can make them public on the Profile page. New readers choose profile visibility when registering and can change it later.
