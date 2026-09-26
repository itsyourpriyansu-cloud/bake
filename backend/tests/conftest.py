from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    database_path = tmp_path / "test.db"
    settings = Settings(
        database_url=f"sqlite+pysqlite:///{database_path}",
        auto_create_schema=True,
        seed_demo_data=True,
    )
    with TestClient(create_app(settings)) as test_client:
        yield test_client
