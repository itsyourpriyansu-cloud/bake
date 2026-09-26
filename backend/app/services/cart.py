from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.errors import ConflictError, DomainError, NotFoundError
from app.domain.cart_identity import configuration_key, normalize_note, normalize_selections
from app.domain.pricing import calculate_redemption, points_to_earn, rupees
from app.models.cart import Cart, CartItem, CartItemModifier, Customer, StoreConfig
from app.models.catalog import ModifierGroup, Product
from app.repositories.cart import CartRepository
from app.repositories.catalog import CatalogRepository
from app.schemas.cart import (
    AvailabilityIssue,
    CartItemCreate,
    CartItemOut,
    CartItemPatch,
    CartOut,
    CustomizationSnapshot,
    ModifierSelection,
    QuoteOut,
    QuoteRequest,
    ThresholdOut,
)
from app.services.catalog import product_out


@dataclass(frozen=True)
class PreparedCustomization:
    selections: list[ModifierSelection]
    snapshots: list[CustomizationSnapshot]
    unit_price_paise: int


class UnavailableModifierError(ConflictError):
    def __init__(self, option_id: str, option_name: str, group_id: str) -> None:
        super().__init__(f"{option_name} is unavailable")
        self.option_id = option_id
        self.option_name = option_name
        self.group_id = group_id


def _selected_ids(selections: list[ModifierSelection], group_id: str) -> set[str]:
    selection = next((item for item in selections if item.group_id == group_id), None)
    return set(selection.option_ids if selection else [])


def _dependency_matches(option: object, selections: list[ModifierSelection]) -> bool:
    dependencies = getattr(option, "variant_dependencies", [])
    return all(
        bool(_selected_ids(selections, dependency["groupId"]) & set(dependency["optionIds"]))
        for dependency in dependencies
    )


def prepare_customization(
    product: Product, requested: list[ModifierSelection] | None
) -> PreparedCustomization:
    groups = [link.group for link in product.modifier_links if link.group.active]
    if requested is None:
        defaults: list[ModifierSelection] = []
        for group in groups:
            if group.required and group.min_selections:
                choices = [option.id for option in group.options if option.available][
                    : group.min_selections
                ]
                if choices:
                    defaults.append(ModifierSelection(group_id=group.id, option_ids=choices))
        selections = normalize_selections(defaults)
    else:
        selections = normalize_selections(requested)

    if len({item.group_id for item in selections}) != len(selections):
        raise DomainError("Each modifier group may appear only once.")

    by_group: dict[str, ModifierGroup] = {group.id: group for group in groups}
    snapshots: list[CustomizationSnapshot] = []
    delta_paise = 0
    for selection in selections:
        selected_group = by_group.get(selection.group_id)
        if selected_group is None:
            raise DomainError(f"Invalid modifier group for '{product.name}'.")
        if len(selection.option_ids) < selected_group.min_selections:
            raise DomainError(
                f"Choose {selected_group.min_selections} {selected_group.name.lower()} option(s)."
            )
        if (
            selected_group.max_selections is not None
            and len(selection.option_ids) > selected_group.max_selections
        ):
            raise DomainError(
                f"Choose up to {selected_group.max_selections} "
                f"{selected_group.name.lower()} option(s)."
            )
        options = {option.id: option for option in selected_group.options}
        for option_id in selection.option_ids:
            option = options.get(option_id)
            if option is None:
                raise DomainError(f"Invalid option for '{selected_group.name}'.")
            if not option.available:
                raise UnavailableModifierError(option.id, option.name, selected_group.id)
            if not _dependency_matches(option, selections):
                raise DomainError(f"Review your {selected_group.name.lower()} selection.")
            delta_paise += option.price_delta_paise
            snapshots.append(
                CustomizationSnapshot(
                    group_id=selected_group.id,
                    group_name=selected_group.name,
                    option_id=option.id,
                    option_name=option.name,
                    price_delta=rupees(option.price_delta_paise),
                )
            )

    for group in groups:
        count = len(_selected_ids(selections, group.id))
        if count < group.min_selections or (group.required and count == 0):
            raise DomainError(f"'{group.name}' is required for '{product.name}'.")

    return PreparedCustomization(selections, snapshots, product.base_price_paise + delta_paise)


class CartService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.carts = CartRepository(session)
        self.catalog = CatalogRepository(session)

    def _cart(self) -> Cart:
        cart = self.carts.active()
        if cart is None:
            raise NotFoundError("Active cart not found")
        return cart

    def _line_out(self, item: CartItem, product: Product) -> CartItemOut:
        grouped: dict[str, list[str]] = {}
        summary: list[CustomizationSnapshot] = []
        for modifier in item.modifiers:
            grouped.setdefault(modifier.group_id, []).append(modifier.option_id)
            summary.append(
                CustomizationSnapshot(
                    group_id=modifier.group_id,
                    group_name=modifier.group_name_snapshot,
                    option_id=modifier.option_id,
                    option_name=modifier.option_name_snapshot,
                    price_delta=rupees(modifier.price_delta_paise),
                )
            )
        return CartItemOut(
            id=item.id,
            cart_id=item.cart_id,
            product_id=item.product_id,
            quantity=item.quantity,
            modifiers=[
                ModifierSelection(group_id=group_id, option_ids=sorted(option_ids))
                for group_id, option_ids in sorted(grouped.items())
            ],
            configuration_key=item.configuration_key,
            special_instructions=item.special_instructions,
            customization_summary=summary,
            unit_price_snapshot=rupees(item.unit_price_snapshot_paise),
            line_total=rupees(item.unit_price_snapshot_paise * item.quantity),
            product=product_out(product),
        )

    def get(self) -> CartOut:
        cart = self._cart()
        products = {
            row.id: row for row in self.catalog.products_by_ids([i.product_id for i in cart.items])
        }
        return CartOut(
            id=cart.id,
            customer_id=cart.customer_id,
            status="ACTIVE",
            updated_at=cart.updated_at.astimezone(UTC).isoformat(),
            items=[
                self._line_out(item, products[item.product_id])
                for item in cart.items
                if item.product_id in products
            ],
        )

    @staticmethod
    def _snapshot_models(item: CartItem, prepared: PreparedCustomization) -> None:
        item.modifiers = [
            CartItemModifier(
                group_id=snapshot.group_id,
                option_id=snapshot.option_id,
                group_name_snapshot=snapshot.group_name,
                option_name_snapshot=snapshot.option_name,
                price_delta_paise=round(snapshot.price_delta * 100),
            )
            for snapshot in prepared.snapshots
        ]

    def add(self, payload: CartItemCreate) -> CartOut:
        cart = self._cart()
        product = self.catalog.product(payload.product_id)
        if product is None:
            raise NotFoundError("Product not found")
        if not product.available:
            raise ConflictError("Product is unavailable")
        prepared = prepare_customization(product, payload.modifiers)
        note = normalize_note(payload.special_instructions)
        key = configuration_key(product.id, prepared.selections, note)
        existing = self.carts.item_by_configuration(cart.id, key)
        if existing:
            existing.quantity = min(99, existing.quantity + payload.quantity)
            existing.unit_price_snapshot_paise = prepared.unit_price_paise
        else:
            item = CartItem(
                id=str(uuid.uuid4()),
                cart_id=cart.id,
                product_id=product.id,
                quantity=payload.quantity,
                configuration_key=key,
                special_instructions=note,
                unit_price_snapshot_paise=prepared.unit_price_paise,
            )
            self._snapshot_models(item, prepared)
            self.session.add(item)
        cart.updated_at = datetime.now(UTC)
        self.session.commit()
        return self.get()

    def update(self, item_id: str, payload: CartItemPatch) -> CartOut:
        item = self.carts.item(item_id)
        if item is None:
            raise NotFoundError("Cart item not found")
        cart = self._cart()
        if payload.quantity == 0:
            self.session.delete(item)
            cart.updated_at = datetime.now(UTC)
            self.session.commit()
            return self.get()

        if payload.quantity is not None:
            item.quantity = payload.quantity

        if payload.modifiers is not None or payload.special_instructions is not None:
            product = self.catalog.product(item.product_id)
            if product is None:
                raise NotFoundError("Product not found")
            if not product.available:
                raise ConflictError("Product is unavailable")
            current = self._line_out(item, product)
            requested = payload.modifiers if payload.modifiers is not None else current.modifiers
            note = normalize_note(
                payload.special_instructions
                if payload.special_instructions is not None
                else item.special_instructions
            )
            prepared = prepare_customization(product, requested)
            key = configuration_key(product.id, prepared.selections, note)
            target = self.carts.item_by_configuration(cart.id, key)
            if target and target.id != item.id:
                target.quantity = min(99, target.quantity + item.quantity)
                target.unit_price_snapshot_paise = prepared.unit_price_paise
                self.session.delete(item)
            else:
                item.configuration_key = key
                item.special_instructions = note
                item.unit_price_snapshot_paise = prepared.unit_price_paise
                self._snapshot_models(item, prepared)

        cart.updated_at = datetime.now(UTC)
        self.session.commit()
        return self.get()

    def remove(self, item_id: str) -> CartOut:
        item = self.carts.item(item_id)
        if item is None:
            raise NotFoundError("Cart item not found")
        cart = self._cart()
        self.session.delete(item)
        cart.updated_at = datetime.now(UTC)
        self.session.commit()
        return self.get()

    def quote(self, payload: QuoteRequest) -> QuoteOut:
        cart = self._cart()
        customer = self.session.get(Customer, cart.customer_id) if cart.customer_id else None
        store = self.session.get(StoreConfig, "STORE-PURI-GRAND-ROAD")
        issues: list[AvailabilityIssue] = []
        subtotal_paise = 0
        item_count = 0
        products = {
            row.id: row for row in self.catalog.products_by_ids([i.product_id for i in cart.items])
        }
        for item in cart.items:
            item_count += item.quantity
            product = products.get(item.product_id)
            if product is None or not product.available:
                name = product.name if product else "This item"
                issues.append(
                    AvailabilityIssue(
                        item_id=item.id,
                        product_id=item.product_id,
                        entity_id=item.product_id,
                        kind="PRODUCT",
                        display_name=name,
                        message=f"{name} is temporarily unavailable.",
                    )
                )
                subtotal_paise += item.unit_price_snapshot_paise * item.quantity
                continue
            selections = self._line_out(item, product).modifiers
            try:
                prepared = prepare_customization(product, selections)
                item.unit_price_snapshot_paise = prepared.unit_price_paise
                subtotal_paise += prepared.unit_price_paise * item.quantity
            except UnavailableModifierError as error:
                issues.append(
                    AvailabilityIssue(
                        item_id=item.id,
                        product_id=item.product_id,
                        entity_id=error.option_id,
                        kind="MODIFIER",
                        display_name=error.option_name,
                        message=(
                            f"{error.option_name} topping is temporarily unavailable."
                            if error.group_id == "toppings"
                            else f"{error.option_name} is temporarily unavailable."
                        ),
                    )
                )
                subtotal_paise += item.unit_price_snapshot_paise * item.quantity
            except DomainError as error:
                issues.append(
                    AvailabilityIssue(
                        item_id=item.id,
                        product_id=item.product_id,
                        entity_id=item.product_id,
                        kind="MODIFIER",
                        display_name="Selected option",
                        message=error.message,
                    )
                )
                subtotal_paise += item.unit_price_snapshot_paise * item.quantity
        self.session.commit()

        requested = payload.points_requested
        available = customer.points_available if customer else 0
        redemption = calculate_redemption(requested, available, subtotal_paise)
        delivery_fee_paise = (
            store.delivery_fee_paise if store and payload.fulfillment_mode == "DELIVERY" else 0
        )
        eligible_paise = max(0, subtotal_paise - redemption.value_paise)
        total_paise = eligible_paise + delivery_fee_paise
        target_paise = 49900
        return QuoteOut(
            item_count=item_count,
            subtotal=rupees(subtotal_paise),
            discount=rupees(redemption.value_paise),
            points_requested=requested,
            points_usable=redemption.usable,
            points_value=rupees(redemption.value_paise),
            points_redeemed=redemption.usable,
            delivery_fee=rupees(delivery_fee_paise),
            eligible_spend=rupees(eligible_paise),
            points_to_earn=points_to_earn(eligible_paise, customer.tier if customer else "MEMBER"),
            total=rupees(total_paise),
            threshold=ThresholdOut(
                target=rupees(target_paise),
                remaining=rupees(max(0, target_paise - subtotal_paise)),
                label="Build a ₹499 feast",
            ),
            availability_issues=issues,
            warnings=redemption.warnings,
            valid=item_count > 0 and not issues,
        )
