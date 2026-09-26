from __future__ import annotations

from typing import Any

from sqlalchemy import JSON, BigInteger, Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    color: Mapped[str] = mapped_column(String(24), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, index=True)


class Product(TimestampMixin, Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    short_description: Mapped[str] = mapped_column(String(320), nullable=False)
    category_id: Mapped[str] = mapped_column(
        ForeignKey("categories.id"), nullable=False, index=True
    )
    base_price_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    veg: Mapped[bool] = mapped_column(Boolean, nullable=False)
    badges: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    image_key: Mapped[str] = mapped_column(String(240), nullable=False)
    available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    prep_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    complexity: Mapped[int] = mapped_column(Integer, nullable=False)
    station: Mapped[str] = mapped_column(String(24), nullable=False)

    modifier_links: Mapped[list[ProductModifierGroup]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductModifierGroup.sort_order",
    )
    pairing_links: Mapped[list[ProductPairing]] = relationship(
        foreign_keys="ProductPairing.product_id", cascade="all, delete-orphan"
    )


class ModifierGroup(Base):
    __tablename__ = "modifier_groups"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    min_selections: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_selections: Mapped[int | None] = mapped_column(Integer)
    multiple: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    options: Mapped[list[ModifierOption]] = relationship(
        back_populates="group", cascade="all, delete-orphan", order_by="ModifierOption.sort_order"
    )


class ModifierOption(Base):
    __tablename__ = "modifier_options"
    __table_args__ = (UniqueConstraint("group_id", "id"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    group_id: Mapped[str] = mapped_column(
        ForeignKey("modifier_groups.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    price_delta_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    variant_dependencies: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, default=list, nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    group: Mapped[ModifierGroup] = relationship(back_populates="options")


class ProductModifierGroup(Base):
    __tablename__ = "product_modifier_groups"
    __table_args__ = (UniqueConstraint("product_id", "group_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    group_id: Mapped[str] = mapped_column(ForeignKey("modifier_groups.id"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    product: Mapped[Product] = relationship(back_populates="modifier_links")
    group: Mapped[ModifierGroup] = relationship()


class ProductPairing(Base):
    __tablename__ = "product_pairings"
    __table_args__ = (UniqueConstraint("product_id", "pairing_product_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    pairing_product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
