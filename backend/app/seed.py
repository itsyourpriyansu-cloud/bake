from typing import TypedDict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.cart import Cart, Customer, StoreConfig
from app.models.catalog import (
    Category,
    ModifierGroup,
    ModifierOption,
    Product,
    ProductModifierGroup,
    ProductPairing,
)

CATEGORIES = [
    ("pizza", "Pizza", "orange"),
    ("kulhad", "Kulhad", "yellow"),
    ("burger", "Burger", "green"),
    ("wrap", "Wrap", "sky"),
    ("sides", "Sides", "yellow"),
    ("shakes", "Shakes", "sky"),
    ("desserts", "Dessert", "pink"),
]


class VariantDependencySeed(TypedDict):
    groupId: str
    optionIds: list[str]


OptionSeed = tuple[str, str, int, list[VariantDependencySeed]]

GROUPS = [
    ("size", "Size", True, 1, 1, False),
    ("base", "Base", True, 1, 1, False),
    ("sauce", "Sauce", True, 1, 1, False),
    ("cheese", "Cheese", True, 1, 1, False),
    ("toppings", "Toppings", False, 0, 3, True),
    ("spice", "Spice", True, 1, 1, False),
    ("meal", "Complete the Meal", False, 0, 2, True),
]

OPTIONS: dict[str, list[OptionSeed]] = {
    "size": [
        ("regular", "Regular", 0, []),
        ("medium", "Medium", 8000, []),
        ("large", "Large", 15000, []),
    ],
    "base": [
        ("normal", "Normal", 0, []),
        ("whole-wheat", "Whole Wheat", 3000, []),
        ("multigrain", "Multigrain", 4000, []),
    ],
    "sauce": [
        ("classic-tomato", "Classic Tomato", 0, []),
        ("smoky-makhani", "Smoky Makhani", 2000, []),
        ("fiery-peri-peri", "Fiery Peri Peri", 2000, []),
    ],
    "cheese": [
        ("regular-cheese", "Regular", 0, []),
        ("extra-cheese", "Extra", 4500, []),
        (
            "double-mozzarella",
            "Double Mozzarella",
            7500,
            [{"groupId": "size", "optionIds": ["medium", "large"]}],
        ),
    ],
    "toppings": [
        (name.casefold(), name, 3000, [])
        for name in ["Paneer", "Mushroom", "Corn", "Olives", "Jalapeño"]
    ],
    "spice": [(f"spice-{name.casefold()}", name, 0, []) for name in ["Mild", "Medium", "Spicy"]],
    "meal": [
        ("meal-fries", "Peri Peri Fries", 7900, []),
        ("meal-garlic-bread", "Cheesy Garlic Bread", 10900, []),
        ("meal-oreo-shake", "Oreo Thick Shake", 12900, []),
    ],
}

PRODUCTS = [
    (
        "PIZZA-VEG-001",
        "classic-veg-pizza",
        "Classic Veg Pizza",
        "Onion, tomato, capsicum, corn and mozzarella on a golden crust.",
        "pizza",
        11000,
        True,
        14,
        2,
        "PIZZA",
        "pizza/classic-veg-pizza.webp",
        ["Bestseller", "Veg", "Customizable"],
    ),
    (
        "PIZZA-PANEER-001",
        "paneer-cheese-pizza",
        "Paneer Cheese Pizza",
        "Paneer, capsicum and onion with a generous layer of mozzarella.",
        "pizza",
        22900,
        True,
        16,
        2,
        "PIZZA",
        "pizza/paneer-cheese-pizza.webp",
        ["Bestseller", "Veg", "Customizable"],
    ),
    (
        "PIZZA-MUSH-001",
        "mushroom-cheese-pizza",
        "Mushroom Cheese Pizza",
        "Sliced mushroom, browned mozzarella and herbs.",
        "pizza",
        19900,
        True,
        16,
        2,
        "PIZZA",
        "pizza/mushroom-cheese-pizza.webp",
        ["Veg", "Customizable"],
    ),
    (
        "PIZZA-CHK-001",
        "chicken-tikka-pizza",
        "Chicken Tikka Pizza",
        "Roasted chicken tikka, onion, capsicum and mozzarella.",
        "pizza",
        24900,
        False,
        18,
        3,
        "PIZZA",
        "pizza/chicken-tikka-pizza.webp",
        ["Spicy", "Customizable"],
    ),
    (
        "KULHAD-001",
        "signature-kulhad-pizza",
        "Signature Kulhad Pizza",
        "Molten cheese and pizza filling baked in a rustic clay kulhad.",
        "kulhad",
        19900,
        True,
        20,
        3,
        "ASSEMBLY",
        "kulhad/signature-kulhad-pizza.webp",
        ["Wave Exclusive", "New", "Veg"],
    ),
    (
        "BURGER-001",
        "paneer-crunch-burger",
        "Paneer Crunch Burger",
        "Crisp paneer patty, lettuce, onion and signature sauce.",
        "burger",
        14900,
        True,
        10,
        1,
        "ASSEMBLY",
        "burger/paneer-crunch-burger.webp",
        ["New", "Veg"],
    ),
    (
        "WRAP-001",
        "chicken-tikka-wrap",
        "Chicken Tikka Wrap",
        "Chicken tikka, fresh vegetables and sauce in a grilled wrap.",
        "wrap",
        17900,
        False,
        10,
        1,
        "ASSEMBLY",
        "wrap/chicken-tikka-wrap.webp",
        ["Spicy"],
    ),
    (
        "FRIES-001",
        "peri-peri-fries",
        "Peri Peri Fries",
        "Crisp fries tossed in lively peri-peri seasoning.",
        "sides",
        9900,
        True,
        6,
        1,
        "FRY",
        "sides/peri-peri-fries.webp",
        ["Bestseller", "Veg"],
    ),
    (
        "GARLIC-001",
        "cheesy-garlic-bread",
        "Cheesy Garlic Bread",
        "Toasted garlic bread with melted cheese and herbs.",
        "sides",
        12900,
        True,
        8,
        1,
        "ASSEMBLY",
        "sides/cheesy-garlic-bread.webp",
        ["Veg"],
    ),
    (
        "SHAKE-001",
        "oreo-thick-shake",
        "Oreo Thick Shake",
        "Creamy cookie-crumb thick shake.",
        "shakes",
        14900,
        True,
        4,
        1,
        "BEVERAGE",
        "drinks/oreo-thick-shake.webp",
        ["Bestseller", "Veg"],
    ),
    (
        "COFFEE-001",
        "cold-coffee",
        "Cold Coffee",
        "Chilled, creamy and frothy coffee.",
        "shakes",
        11900,
        True,
        4,
        1,
        "BEVERAGE",
        "drinks/cold-coffee.webp",
        ["Veg"],
    ),
    (
        "BROWNIE-001",
        "chocolate-brownie",
        "Chocolate Brownie",
        "Dense, moist brownie with a lightly cracked top.",
        "desserts",
        9900,
        True,
        2,
        1,
        "ASSEMBLY",
        "desserts/chocolate-brownie.webp",
        ["Veg"],
    ),
]

PAIRINGS = {
    "PIZZA-VEG-001": ["COFFEE-001"],
    "PIZZA-PANEER-001": ["GARLIC-001", "SHAKE-001"],
    "PIZZA-MUSH-001": ["FRIES-001", "COFFEE-001"],
    "PIZZA-CHK-001": ["GARLIC-001", "SHAKE-001"],
}


def seed_demo_data(session: Session) -> None:
    if session.scalar(select(func.count(Product.id))):
        return
    session.add_all(
        [
            Category(id=item[0], name=item[1], color=item[2], sort_order=index + 1)
            for index, item in enumerate(CATEGORIES)
        ]
    )
    groups: dict[str, ModifierGroup] = {}
    for group_id, name, required, minimum, maximum, multiple in GROUPS:
        group = ModifierGroup(
            id=group_id,
            name=name,
            required=required,
            min_selections=minimum,
            max_selections=maximum,
            multiple=multiple,
        )
        group.options = [
            ModifierOption(
                id=option_id,
                group_id=group_id,
                name=option_name,
                price_delta_paise=price,
                variant_dependencies=dependencies,
                sort_order=index,
            )
            for index, (option_id, option_name, price, dependencies) in enumerate(OPTIONS[group_id])
        ]
        groups[group_id] = group
        session.add(group)
    session.flush()

    products: dict[str, Product] = {}
    for row in PRODUCTS:
        product = Product(
            id=row[0],
            slug=row[1],
            name=row[2],
            short_description=row[3],
            category_id=row[4],
            base_price_paise=row[5],
            veg=row[6],
            prep_minutes=row[7],
            complexity=row[8],
            station=row[9],
            image_key=row[10],
            badges=row[11],
            available=True,
        )
        if row[4] == "pizza":
            product.modifier_links = [
                ProductModifierGroup(group=groups[group_id], sort_order=index)
                for index, (group_id, *_rest) in enumerate(GROUPS)
            ]
        products[row[0]] = product
        session.add(product)
    session.flush()
    for product_id, pairing_ids in PAIRINGS.items():
        session.add_all(
            [
                ProductPairing(
                    product_id=product_id, pairing_product_id=pairing_id, sort_order=index
                )
                for index, pairing_id in enumerate(pairing_ids)
            ]
        )
    session.add(
        Customer(
            id="CUST001",
            first_name="Priyanshu",
            phone="+919876543210",
            tier="GOLD",
            points_available=182,
        )
    )
    session.add(
        StoreConfig(
            id="STORE-PURI-GRAND-ROAD",
            name="The Pizza Wave",
            city="Puri",
            acceptance_mode="HYBRID",
            open=True,
            delivery_enabled=True,
            pickup_enabled=True,
            store_order_enabled=True,
            delivery_fee_paise=0,
        )
    )
    session.flush()
    session.add(
        Cart(id="CART-DEMO", customer_id="CUST001", status="ACTIVE", fulfillment_type="DELIVERY")
    )
    session.commit()
