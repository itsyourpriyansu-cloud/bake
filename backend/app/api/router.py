from fastapi import APIRouter

from .routes import cart, catalog, system

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(system.router)
api_router.include_router(catalog.router)
api_router.include_router(cart.router)
