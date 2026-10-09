COMPOSE ?= docker compose
DEV_COMPOSE = $(COMPOSE) -f docker-compose.dev.yml
PROD_COMPOSE = $(COMPOSE) -f docker-compose.yml

.PHONY: help dev dev-detach dev-build dev-down dev-logs dev-shell prod prod-build prod-down prod-logs ps lint build clean-dev-data

help:
	@printf "\nBookify Docker commands\n"
	@printf "  make dev          Start local Docker dev server at http://127.0.0.1:5173\n"
	@printf "  make dev-detach   Start local Docker dev server in the background\n"
	@printf "  make dev-build    Rebuild/recreate local Docker dev server\n"
	@printf "  make dev-down     Stop local Docker dev server\n"
	@printf "  make dev-logs     Follow local Docker dev logs\n"
	@printf "  make dev-shell    Open a shell in the dev container\n"
	@printf "  make prod         Build and start production container in the background\n"
	@printf "  make prod-build   Build production image\n"
	@printf "  make prod-down    Stop production container\n"
	@printf "  make prod-logs    Follow production logs\n"
	@printf "  make ps           Show Docker services\n"
	@printf "  make lint         Run ESLint in Docker\n"
	@printf "  make build        Run production build in Docker\n\n"

dev:
	$(DEV_COMPOSE) up --build

dev-detach:
	$(DEV_COMPOSE) up -d --build

dev-build:
	$(DEV_COMPOSE) build --no-cache

dev-down:
	$(DEV_COMPOSE) down

dev-logs:
	$(DEV_COMPOSE) logs -f bookify-dev

dev-shell:
	$(DEV_COMPOSE) run --rm bookify-dev sh

prod:
	$(PROD_COMPOSE) up -d --build

prod-build:
	$(PROD_COMPOSE) build

prod-down:
	$(PROD_COMPOSE) down

prod-logs:
	$(PROD_COMPOSE) logs -f bookify

ps:
	$(COMPOSE) ps
	$(DEV_COMPOSE) ps

lint:
	$(DEV_COMPOSE) run --rm bookify-dev sh -c "npm ci && npm run lint"

build:
	$(DEV_COMPOSE) run --rm bookify-dev sh -c "npm ci && npm run build"

clean-dev-data:
	$(DEV_COMPOSE) down -v
