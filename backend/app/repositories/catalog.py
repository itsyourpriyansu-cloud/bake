from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.catalog import ModifierGroup, Product, ProductModifierGroup

PRODUCT_LOAD = (
    selectinload(Product.modifier_links)
    .selectinload(ProductModifierGroup.group)
    .selectinload(ModifierGroup.options)
)


class CatalogRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def products(self, category: str | None = None) -> list[Product]:
        statement = (
            select(Product).options(PRODUCT_LOAD).order_by(Product.category_id, Product.name)
        )
        if category:
            statement = statement.where(Product.category_id == category)
        return list(self.session.scalars(statement).unique())

    def product(self, product_id: str) -> Product | None:
        statement = select(Product).options(PRODUCT_LOAD).where(Product.id == product_id)
        return self.session.scalar(statement)

    def products_by_ids(self, product_ids: list[str]) -> list[Product]:
        if not product_ids:
            return []
        statement = select(Product).options(PRODUCT_LOAD).where(Product.id.in_(product_ids))
        rows = list(self.session.scalars(statement).unique())
        by_id = {row.id: row for row in rows}
        return [by_id[item_id] for item_id in product_ids if item_id in by_id]
