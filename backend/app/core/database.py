from collections.abc import Generator

from fastapi import Request
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker


class Database:
    def __init__(self, url: str) -> None:
        connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
        self.engine: Engine = create_engine(url, pool_pre_ping=True, connect_args=connect_args)
        if url.startswith("sqlite"):
            event.listen(self.engine, "connect", self._enable_sqlite_foreign_keys)
        self.session_factory = sessionmaker(bind=self.engine, expire_on_commit=False)

    @staticmethod
    def _enable_sqlite_foreign_keys(dbapi_connection: object, _: object) -> None:
        cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    def session(self) -> Generator[Session, None, None]:
        with self.session_factory() as session:
            yield session


def get_session(request: Request) -> Generator[Session, None, None]:
    yield from request.app.state.database.session()
