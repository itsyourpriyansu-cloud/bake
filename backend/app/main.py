from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.database import Database
from app.core.errors import install_error_handlers
from app.models.base import Base
from app.seed import seed_demo_data


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved = settings or get_settings()
    database = Database(resolved.database_url)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        if resolved.auto_create_schema:
            Base.metadata.create_all(database.engine)
        if resolved.seed_demo_data:
            with database.session_factory() as session:
                seed_demo_data(session)
        yield
        database.engine.dispose()

    app = FastAPI(
        title="The Pizza Wave API",
        version="0.1.0",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )
    app.state.database = database
    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    install_error_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
