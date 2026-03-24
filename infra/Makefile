.PHONY: up down reset logs ps shell-postgres shell-redis tools

# Copy .env.example to .env if it doesn't exist
.env:
	cp .env.example .env
	@echo ".env created — review and adjust values before starting"

## Start core infrastructure (postgres, redis, n8n, minio, mailhog)
up: .env
	docker compose up -d
	@echo ""
	@echo "Services:"
	@echo "  PostgreSQL   → localhost:5432"
	@echo "  Redis        → localhost:6379"
	@echo "  n8n          → http://localhost:5678  (admin / admin123)"
	@echo "  MinIO API    → http://localhost:9000"
	@echo "  MinIO UI     → http://localhost:9001  (minio / minio123)"
	@echo "  Mailhog      → http://localhost:8025"

## Start with optional tools (redis-commander)
tools: .env
	docker compose --profile tools up -d

## Stop all services
down:
	docker compose --profile tools down

## Stop and delete all volumes (full reset — data will be lost)
reset:
	docker compose --profile tools down -v
	@echo "All volumes deleted."

## Follow logs
logs:
	docker compose logs -f $(filter-out $@,$(MAKECMDGOALS))

## Show running containers
ps:
	docker compose ps

## Open a psql shell
shell-postgres:
	docker compose exec postgres psql -U postgres

## Open a redis-cli shell
shell-redis:
	docker compose exec redis redis-cli

## Open n8n shell
shell-n8n:
	docker compose exec n8n sh
