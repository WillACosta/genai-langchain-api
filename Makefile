help:
	@echo "Available commands:"
	@echo "  run        Start services."
	@echo "  build      Build and start services."
	@echo "  stop-all   Stop all services."
	@echo "  remove     Remove all containers."
	@echo "  clean      Remove temporary and cache files."

run:
	docker compose up -d

build:
	docker compose up --build -d

stop-all:
	docker compose stop $(docker ps -q)

remove:
	docker compose down

clean:
	rm -rf node_modules/ uploads/*.pdf
