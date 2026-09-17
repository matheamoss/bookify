# Bookify on a server

Bookify runs as one container: the website, account API, and SQLite database. The named Docker volume keeps accounts, playlists, and ratings when the container is rebuilt.

## Start

1. Copy this project to your server.
2. Point your HTTPS reverse proxy at `127.0.0.1:3000`.
3. Run `docker compose up -d --build` from this directory.

The app binds to localhost by default. Set `BOOKIFY_PORT` if port 3000 is occupied. Set `BOOKIFY_BIND=0.0.0.0` only when you deliberately want Docker to expose the port externally. Keep `COOKIE_SECURE=true` when visitors use HTTPS. For local HTTP testing only, set `COOKIE_SECURE=false` before starting Compose.

Check the container with `docker compose ps` and `docker compose logs -f bookify`. Back up the `bookify_data` volume; it contains user accounts and libraries. Do not run `docker compose down -v` unless you intend to erase it.

Registration uses name, email, and a password of at least 12 characters. Passwords are hashed; session cookies are HTTP-only. This version has no email verification or password reset, so add those before opening registration to a large public audience.

Readers can search public profiles, follow each other, and view public playlists, saved books, and ratings. Email addresses remain private. Existing accounts are private after the database migration; their owners can make them public on the Profile page. New readers choose profile visibility when registering and can change it later.
