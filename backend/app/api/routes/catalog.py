from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.schemas.catalog import CategoryOut, MenuOut, ProductDetailOut, ProductOut
from app.services.catalog import CatalogService

router = APIRouter(tags=["catalog"])


@router.get("/categories", response_model=list[CategoryOut], response_model_by_alias=True)
def categories(session: Session = Depends(get_session)) -> list[CategoryOut]:
    return CatalogService(session).categories()


@router.get("/products", response_model=list[ProductOut], response_model_by_alias=True)
def products(
    category: str | None = Query(default=None), session: Session = Depends(get_session)
) -> list[ProductOut]:
    return CatalogService(session).products(category)


@router.get("/products/{product_id}", response_model=ProductDetailOut, response_model_by_alias=True)
def product(product_id: str, session: Session = Depends(get_session)) -> ProductDetailOut:
    return CatalogService(session).product_detail(product_id)


@router.get("/menu", response_model=MenuOut, response_model_by_alias=True)
def menu(session: Session = Depends(get_session)) -> MenuOut:
    return CatalogService(session).menu()


@router.get("/recommendations", response_model=list[ProductOut], response_model_by_alias=True)
def recommendations(
    context: str | None = Query(default=None), session: Session = Depends(get_session)
) -> list[ProductOut]:
    return CatalogService(session).recommendations(context)


@router.get("/search", response_model=list[ProductOut], response_model_by_alias=True)
def search(
    q: str = Query(default="", max_length=100), session: Session = Depends(get_session)
) -> list[ProductOut]:
    return CatalogService(session).search(q)
