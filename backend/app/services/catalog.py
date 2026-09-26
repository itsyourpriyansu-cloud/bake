from typing import cast

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.domain.pricing import points_to_earn, rupees
from app.models.cart import Customer
from app.models.catalog import Category, Product, ProductPairing
from app.repositories.catalog import CatalogRepository
from app.schemas.catalog import (
    Badge,
    CategoryOut,
    MenuOut,
    ModifierGroupOut,
    ModifierOptionOut,
    ProductDetailOut,
    ProductOut,
    SmartCollectionOut,
    Station,
    VariantDependencyOut,
)

SMART_COLLECTIONS = [
    SmartCollectionOut(id="under-199", name="Under ₹199"),
    SmartCollectionOut(id="best-sellers", name="Best Sellers"),
    SmartCollectionOut(id="veg-favourites", name="Veg Favourites"),
    SmartCollectionOut(id="cheese-lovers", name="Cheese Lovers"),
    SmartCollectionOut(id="for-two", name="For Two"),
    SmartCollectionOut(id="family", name="Family"),
    SmartCollectionOut(id="quick-bites", name="Quick Bites"),
    SmartCollectionOut(id="something-sweet", name="Something Sweet"),
]


def product_out(product: Product) -> ProductOut:
    groups = [
        ModifierGroupOut(
            id=link.group.id,
            name=link.group.name,
            required=link.group.required,
            min_selections=link.group.min_selections,
            max_selections=link.group.max_selections,
            multiple=link.group.multiple,
            options=[
                ModifierOptionOut(
                    id=option.id,
                    name=option.name,
                    group_id=option.group_id,
                    price_delta=rupees(option.price_delta_paise),
                    available=option.available,
                    variant_dependencies=[
                        VariantDependencyOut.model_validate(dependency)
                        for dependency in option.variant_dependencies
                    ],
                )
                for option in link.group.options
                if link.group.active
            ],
        )
        for link in product.modifier_links
        if link.group.active
    ]
    return ProductOut(
        id=product.id,
        name=product.name,
        description=product.short_description,
        category=product.category_id,
        price=rupees(product.base_price_paise),
        veg=product.veg,
        available=product.available,
        prep_minutes=product.prep_minutes,
        complexity=product.complexity,
        station=cast(Station, product.station),
        image=f"/assets/products/{product.image_key}",
        badges=[cast(Badge, badge) for badge in product.badges],
        modifier_groups=groups or None,
    )


class CatalogService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = CatalogRepository(session)

    def categories(self) -> list[CategoryOut]:
        rows = self.session.scalars(select(Category).order_by(Category.sort_order)).all()
        return [CategoryOut.model_validate(row) for row in rows]

    def products(self, category: str | None = None) -> list[ProductOut]:
        return [product_out(row) for row in self.repository.products(category)]

    def menu(self) -> MenuOut:
        return MenuOut(
            categories=self.categories(), products=self.products(), collections=SMART_COLLECTIONS
        )

    def product_detail(self, product_id: str) -> ProductDetailOut:
        product = self.repository.product(product_id)
        if product is None:
            raise NotFoundError("Product not found")
        pairing_ids = list(
            self.session.scalars(
                select(ProductPairing.pairing_product_id)
                .where(ProductPairing.product_id == product_id)
                .order_by(ProductPairing.sort_order)
            )
        )
        customer = self.session.get(Customer, "CUST001")
        return ProductDetailOut(
            product=product_out(product),
            pairings=[product_out(row) for row in self.repository.products_by_ids(pairing_ids)],
            points_preview=points_to_earn(
                product.base_price_paise, customer.tier if customer else "MEMBER"
            ),
        )

    def recommendations(self, context: str | None) -> list[ProductOut]:
        products = self.repository.products()
        if context == "popular":
            ids = ["PIZZA-PANEER-001", "KULHAD-001", "FRIES-001", "SHAKE-001"]
        else:
            ids = ["PIZZA-VEG-001", "PIZZA-PANEER-001", "FRIES-001", "SHAKE-001"]
        by_id = {product.id: product for product in products}
        return [product_out(by_id[item_id]) for item_id in ids if item_id in by_id]

    def search(self, query: str) -> list[ProductOut]:
        normalized = query.casefold().strip()
        products = self.repository.products()
        if not normalized:
            return []
        if normalized in {"under 200", "under ₹200", "under200"}:
            return [product_out(row) for row in products if row.base_price_paise < 20000]
        aliases = {"veg": ["veg", "paneer", "mushroom", "corn"], "combo": ["meal", "pizza"]}
        terms = aliases.get(normalized, [normalized])
        return [
            product_out(row)
            for row in products
            if any(
                term
                in " ".join(
                    [row.name, row.short_description, row.category_id, *row.badges]
                ).casefold()
                for term in terms
            )
        ]
