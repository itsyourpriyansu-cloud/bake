from __future__ import annotations

from sqlalchemy import BigInteger, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    first_name: Mapped[str] = mapped_column(String(80), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    tier: Mapped[str] = mapped_column(String(24), nullable=False)
    points_available: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class StoreConfig(Base):
    __tablename__ = "store_config"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    city: Mapped[str] = mapped_column(String(80), nullable=False)
    acceptance_mode: Mapped[str] = mapped_column(String(16), default="HYBRID", nullable=False)
    open: Mapped[bool] = mapped_column(default=True, nullable=False)
    delivery_enabled: Mapped[bool] = mapped_column(default=True, nullable=False)
    pickup_enabled: Mapped[bool] = mapped_column(default=True, nullable=False)
    store_order_enabled: Mapped[bool] = mapped_column(default=True, nullable=False)
    delivery_fee_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)


class Cart(TimestampMixin, Base):
    __tablename__ = "carts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_id: Mapped[str | None] = mapped_column(ForeignKey("customers.id"), index=True)
    fulfillment_type: Mapped[str] = mapped_column(String(16), default="DELIVERY", nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="ACTIVE", nullable=False, index=True)
    points_requested: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    items: Mapped[list[CartItem]] = relationship(
        back_populates="cart", cascade="all, delete-orphan", order_by="CartItem.created_at"
    )


class CartItem(TimestampMixin, Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("cart_id", "configuration_key"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    cart_id: Mapped[str] = mapped_column(ForeignKey("carts.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    configuration_key: Mapped[str] = mapped_column(String(2048), nullable=False)
    special_instructions: Mapped[str] = mapped_column(String(240), default="", nullable=False)
    unit_price_snapshot_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)

    cart: Mapped[Cart] = relationship(back_populates="items")
    modifiers: Mapped[list[CartItemModifier]] = relationship(
        back_populates="cart_item", cascade="all, delete-orphan", order_by="CartItemModifier.id"
    )


class CartItemModifier(Base):
    __tablename__ = "cart_item_modifiers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cart_item_id: Mapped[str] = mapped_column(
        ForeignKey("cart_items.id", ondelete="CASCADE"), index=True
    )
    group_id: Mapped[str] = mapped_column(String(48), nullable=False)
    option_id: Mapped[str] = mapped_column(String(64), nullable=False)
    group_name_snapshot: Mapped[str] = mapped_column(String(100), nullable=False)
    option_name_snapshot: Mapped[str] = mapped_column(String(120), nullable=False)
    price_delta_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    cart_item: Mapped[CartItem] = relationship(back_populates="modifiers")
