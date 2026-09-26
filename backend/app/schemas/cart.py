from typing import Literal

from pydantic import Field

from .base import ApiModel
from .catalog import ProductOut


class ModifierSelection(ApiModel):
    group_id: str = Field(min_length=1, max_length=48)
    option_ids: list[str] = Field(default_factory=list)


class CustomizationSnapshot(ApiModel):
    group_id: str
    group_name: str
    option_id: str
    option_name: str
    price_delta: float


class CartItemCreate(ApiModel):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=99)
    modifiers: list[ModifierSelection] | None = None
    special_instructions: str = Field(default="", max_length=240)


class CartItemPatch(ApiModel):
    quantity: int | None = Field(default=None, ge=0, le=99)
    modifiers: list[ModifierSelection] | None = None
    special_instructions: str | None = Field(default=None, max_length=240)


class CartItemOut(ApiModel):
    id: str
    cart_id: str
    product_id: str
    quantity: int
    modifiers: list[ModifierSelection]
    configuration_key: str
    special_instructions: str
    customization_summary: list[CustomizationSnapshot]
    unit_price_snapshot: float
    line_total: float
    product: ProductOut


class CartOut(ApiModel):
    id: str
    customer_id: str | None = None
    status: Literal["ACTIVE"]
    updated_at: str
    items: list[CartItemOut]


class QuoteRequest(ApiModel):
    fulfillment_mode: Literal["DELIVERY", "PICKUP", "STORE"] = "DELIVERY"
    points_requested: int = Field(default=0, ge=0)


class AvailabilityIssue(ApiModel):
    item_id: str
    product_id: str
    entity_id: str
    kind: Literal["PRODUCT", "MODIFIER"]
    display_name: str
    message: str


class ThresholdOut(ApiModel):
    target: float
    remaining: float
    label: str


class QuoteOut(ApiModel):
    item_count: int
    subtotal: float
    discount: float
    points_requested: int
    points_usable: int
    points_value: float
    points_redeemed: int
    delivery_fee: float
    eligible_spend: float
    points_to_earn: int
    total: float
    threshold: ThresholdOut
    availability_issues: list[AvailabilityIssue]
    warnings: list[str]
    valid: bool
