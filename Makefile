SHELL := /bin/bash

PYTHON ?= python3.11
VENV ?= .venv
WEB_DIR ?= web
CITY ?= boston
LANDSAT_COLLECTION_ID ?= landsat-c2l2-st

PYTHON_IN_VENV := $(VENV)/bin/python
PIP_IN_VENV := $(VENV)/bin/pip
UVICORN_IN_VENV := $(VENV)/bin/uvicorn

.PHONY: help check-python install-python setup web-install api run-api web build test validate-packages quick-reference live-landsat live-ecostress

help:
	@echo "Available targets:"
	@echo "  make check-python       Check whether your interpreter setup matches the repo requirements"
	@echo "  make install-python     Install Python 3.11 with Homebrew when it is missing"
	@echo "  make setup              Create the Python 3.11 virtualenv and install web dependencies"
	@echo "  make web-install        Install frontend dependencies"
	@echo "  make api                Run the FastAPI server from the project virtualenv"
	@echo "  make run-api            Alias for 'make api'"
	@echo "  make web                Run the TanStack frontend"
	@echo "  make build              Build the frontend"
	@echo "  make test               Run frontend tests"
	@echo "  make validate-packages  Validate bundled package metadata and artifacts"
	@echo "  make live-landsat       Build the latest Landsat bridge JSON for a city"
	@echo "  make live-ecostress     Build the latest ECOSTRESS bridge JSON for a city"
	@echo "  make quick-reference    Print the main local run commands"

check-python:
	python3 scripts/check_python_env.py

install-python:
	@if command -v $(PYTHON) >/dev/null 2>&1; then \
		echo "$(PYTHON) is already available."; \
	elif command -v brew >/dev/null 2>&1; then \
		echo "Installing Python 3.11 with Homebrew..."; \
		brew install python@3.11; \
	else \
		echo "python3.11 is missing and Homebrew is not available."; \
		echo "Install Python 3.11 manually, then rerun 'make setup'."; \
		exit 1; \
	fi

setup:
	PYTHON_BIN=$(PYTHON) bash scripts/bootstrap_env.sh
	$(MAKE) web-install

web-install:
	npm --prefix $(WEB_DIR) install

api:
	bash scripts/run_api.sh

run-api: api

web:
	npm --prefix $(WEB_DIR) run dev

build:
	npm --prefix $(WEB_DIR) run build

test:
	npm --prefix $(WEB_DIR) test

validate-packages:
	@test -x "$(PYTHON_IN_VENV)" || (echo "Virtualenv is missing. Run 'make setup' first."; exit 1)
	PYTHONPATH=. $(PYTHON_IN_VENV) scripts/validate_city_packages.py

live-landsat:
	@test -x "$(PYTHON_IN_VENV)" || (echo "Virtualenv is missing. Run 'make setup' first."; exit 1)
	PYTHONPATH=. $(PYTHON_IN_VENV) scripts/fetch_landsat_live_source.py --city-id "$(CITY)" --collection-id "$(LANDSAT_COLLECTION_ID)"

live-ecostress:
	@test -x "$(PYTHON_IN_VENV)" || (echo "Virtualenv is missing. Run 'make setup' first."; exit 1)
	PYTHONPATH=. $(PYTHON_IN_VENV) scripts/fetch_ecostress_live_source.py --city-id "$(CITY)"

quick-reference:
	@echo "API:              make api"
	@echo "Frontend:         make web"
	@echo "Frontend build:   make build"
	@echo "Frontend tests:   make test"
	@echo "Package checks:   make validate-packages"
	@echo "Landsat bridge:   make live-landsat CITY=boston LANDSAT_COLLECTION_ID=landsat-c2l2-st"
	@echo "ECOSTRESS bridge: make live-ecostress CITY=boston"
	@echo "Environment:      make setup"
