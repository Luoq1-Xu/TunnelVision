.PHONY: help dev setup cv-setup web-setup infra-up infra-down clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Setup
setup: cv-setup web-setup ## Install all dependencies

cv-setup: ## Install CV package dependencies
	cd packages/cv && uv sync

web-setup: ## Install web frontend dependencies
	cd packages/web && npm install

# Development
dev: ## Run dev server
	cd packages/web && npm run dev

# Infrastructure
infra-up: ## Start Postgres + Redis via Docker
	docker-compose -f infra/docker-compose.yml up -d

infra-down: ## Stop infrastructure
	docker-compose -f infra/docker-compose.yml down

# Clean
clean: ## Remove build artifacts
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .next -exec rm -rf {} + 2>/dev/null || true
