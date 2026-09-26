from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.schemas.cart import CartItemCreate, CartItemPatch, CartOut, QuoteOut, QuoteRequest
from app.services.cart import CartService

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartOut, response_model_by_alias=True)
def get_cart(session: Session = Depends(get_session)) -> CartOut:
    return CartService(session).get()


@router.post(
    "/items",
    response_model=CartOut,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
def add_item(payload: CartItemCreate, session: Session = Depends(get_session)) -> CartOut:
    return CartService(session).add(payload)


@router.patch("/items/{item_id}", response_model=CartOut, response_model_by_alias=True)
def update_item(
    item_id: str, payload: CartItemPatch, session: Session = Depends(get_session)
) -> CartOut:
    return CartService(session).update(item_id, payload)


@router.delete("/items/{item_id}", response_model=CartOut, response_model_by_alias=True)
def remove_item(item_id: str, session: Session = Depends(get_session)) -> CartOut:
    return CartService(session).remove(item_id)


@router.post("/quote", response_model=QuoteOut, response_model_by_alias=True)
def quote(payload: QuoteRequest, session: Session = Depends(get_session)) -> QuoteOut:
    return CartService(session).quote(payload)
