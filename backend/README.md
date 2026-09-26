# The Pizza Wave API

Production-shaped Python API for the Pizza Wave customer ordering flow. The browser-facing
contract remains `/api/v1`, so the React app can switch between MSW and FastAPI without
changing any screen code.

## Stack

- Python 3.11+
- FastAPI and Uvicorn
- Pydantic v2 and pydantic-settings
- SQLAlchemy 2 and Alembic
- PostgreSQL through psycopg 3
- pytest, Ruff, and mypy

## Local setup

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python -m pip install -e ".[dev]"
Copy-Item .env.example .env
.\.venv\Scripts\python -m alembic upgrade head
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

The example environment targets PostgreSQL. Without an environment file, development uses
`backend/pizza_wave.db` for a zero-configuration smoke run; PostgreSQL remains the intended
runtime database.

To point the React app at FastAPI, disable MSW and use the full API URL:

```text
VITE_ENABLE_MSW=false
VITE_API_BASE=http://127.0.0.1:8000/api/v1
```

Money is stored and calculated as integer paise. Products, modifiers, prices, availability,
cart-line merging, and quotes are always validated by the API. UI totals are display-only.
