from typing import Literal

from .base import ApiModel

Station = Literal["PIZZA", "FRY", "BEVERAGE", "ASSEMBLY"]
Badge = Literal["Bestseller", "New", "Veg", "Spicy", "Wave Exclusive", "Customizable"]


class VariantDependencyOut(ApiModel):
    group_id: str
    option_ids: list[str]


class ModifierOptionOut(ApiModel):
    id: str
    name: str
    group_id: str
    price_delta: float
    available: bool = True
    variant_dependencies: list[VariantDependencyOut] = []


class ModifierGroupOut(ApiModel):
    id: str
    name: str
    required: bool
    min_selections: int = 0
    max_selections: int | None = None
    multiple: bool = False
    options: list[ModifierOptionOut]


class CategoryOut(ApiModel):
    id: str
    name: str
    color: str
    sort_order: int


class ProductOut(ApiModel):
    id: str
    name: str
    description: str
    category: str
    price: float
    veg: bool
    available: bool
    prep_minutes: int
    complexity: int
    station: Station
    image: str
    badges: list[Badge]
    modifier_groups: list[ModifierGroupOut] | None = None


class SmartCollectionOut(ApiModel):
    id: str
    name: str


class MenuOut(ApiModel):
    categories: list[CategoryOut]
    products: list[ProductOut]
    collections: list[SmartCollectionOut]


class ProductDetailOut(ApiModel):
    product: ProductOut
    pairings: list[ProductOut]
    points_preview: int
