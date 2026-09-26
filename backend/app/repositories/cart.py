from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.cart import Cart, CartItem


class CartRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def active(self, cart_id: str = "CART-DEMO") -> Cart | None:
        statement = (
            select(Cart)
            .options(selectinload(Cart.items).selectinload(CartItem.modifiers))
            .where(Cart.id == cart_id, Cart.status == "ACTIVE")
            .execution_options(populate_existing=True)
        )
        return self.session.scalar(statement)

    def item(self, item_id: str) -> CartItem | None:
        statement = (
            select(CartItem).options(selectinload(CartItem.modifiers)).where(CartItem.id == item_id)
        )
        return self.session.scalar(statement)

    def item_by_configuration(self, cart_id: str, key: str) -> CartItem | None:
        statement = (
            select(CartItem)
            .options(selectinload(CartItem.modifiers))
            .where(CartItem.cart_id == cart_id, CartItem.configuration_key == key)
        )
        return self.session.scalar(statement)
