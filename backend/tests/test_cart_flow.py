from fastapi.testclient import TestClient

from app.models.catalog import ModifierOption

DEFAULTS = [
    {"groupId": "size", "optionIds": ["regular"]},
    {"groupId": "base", "optionIds": ["normal"]},
    {"groupId": "sauce", "optionIds": ["classic-tomato"]},
    {"groupId": "cheese", "optionIds": ["regular-cheese"]},
    {"groupId": "spice", "optionIds": ["spice-mild"]},
]


def test_identical_customizations_merge_but_variants_stay_separate(client: TestClient) -> None:
    first = client.post(
        "/api/v1/cart/items",
        json={"productId": "PIZZA-VEG-001", "quantity": 1, "modifiers": DEFAULTS},
    )
    assert first.status_code == 201
    again = client.post(
        "/api/v1/cart/items",
        json={"productId": "PIZZA-VEG-001", "quantity": 2, "modifiers": list(reversed(DEFAULTS))},
    )
    assert again.status_code == 201
    assert again.json()["items"][0]["quantity"] == 3

    variant = [dict(selection) for selection in DEFAULTS]
    variant[0] = {"groupId": "size", "optionIds": ["medium"]}
    response = client.post(
        "/api/v1/cart/items",
        json={"productId": "PIZZA-VEG-001", "quantity": 1, "modifiers": variant},
    )
    assert response.status_code == 201
    assert len(response.json()["items"]) == 2


def test_quantity_zero_removes_and_quote_is_server_shaped(client: TestClient) -> None:
    cart = client.post("/api/v1/cart/items", json={"productId": "FRIES-001", "quantity": 2}).json()
    line_id = cart["items"][0]["id"]
    quote = client.post(
        "/api/v1/cart/quote", json={"fulfillmentMode": "DELIVERY", "pointsRequested": 50}
    )
    assert quote.status_code == 200
    assert quote.json() == {
        "itemCount": 2,
        "subtotal": 198.0,
        "discount": 39.0,
        "pointsRequested": 50,
        "pointsUsable": 39,
        "pointsValue": 39.0,
        "pointsRedeemed": 39,
        "deliveryFee": 0.0,
        "eligibleSpend": 159.0,
        "pointsToEarn": 6,
        "total": 159.0,
        "threshold": {"target": 499.0, "remaining": 301.0, "label": "Build a ₹499 feast"},
        "availabilityIssues": [],
        "warnings": ["Points reduced to stay within redemption limits."],
        "valid": True,
    }
    removed = client.patch(f"/api/v1/cart/items/{line_id}", json={"quantity": 0})
    assert removed.status_code == 200
    assert removed.json()["items"] == []


def test_invalid_or_dependency_blocked_modifiers_are_rejected(client: TestClient) -> None:
    missing = client.post(
        "/api/v1/cart/items",
        json={"productId": "PIZZA-VEG-001", "modifiers": []},
    )
    assert missing.status_code == 400

    selections = [dict(selection) for selection in DEFAULTS]
    selections[3] = {"groupId": "cheese", "optionIds": ["double-mozzarella"]}
    blocked = client.post(
        "/api/v1/cart/items",
        json={"productId": "PIZZA-VEG-001", "modifiers": selections},
    )
    assert blocked.status_code == 400
    assert blocked.json()["message"] == "Review your cheese selection."


def test_editing_to_an_existing_configuration_merges_lines(client: TestClient) -> None:
    first = client.post(
        "/api/v1/cart/items",
        json={"productId": "FRIES-001", "quantity": 1, "specialInstructions": "Crispy"},
    ).json()
    second = client.post(
        "/api/v1/cart/items",
        json={"productId": "FRIES-001", "quantity": 2, "specialInstructions": "No salt"},
    ).json()
    second_id = next(
        item["id"] for item in second["items"] if item["specialInstructions"] == "No salt"
    )
    merged = client.patch(
        f"/api/v1/cart/items/{second_id}", json={"specialInstructions": "  crispy  "}
    )
    assert merged.status_code == 200
    assert len(merged.json()["items"]) == 1
    assert merged.json()["items"][0]["quantity"] == 3
    assert first["items"][0]["configurationKey"] == merged.json()["items"][0]["configurationKey"]


def test_quote_reports_modifier_availability_without_deleting_the_line(client: TestClient) -> None:
    selections = [*DEFAULTS, {"groupId": "toppings", "optionIds": ["mushroom"]}]
    cart = client.post(
        "/api/v1/cart/items",
        json={"productId": "PIZZA-VEG-001", "modifiers": selections},
    ).json()
    line_id = cart["items"][0]["id"]
    with client.app.state.database.session_factory() as session:
        mushroom = session.get(ModifierOption, "mushroom")
        assert mushroom is not None
        mushroom.available = False
        session.commit()

    quote = client.post("/api/v1/cart/quote", json={}).json()
    assert quote["valid"] is False
    assert quote["availabilityIssues"][0] == {
        "itemId": line_id,
        "productId": "PIZZA-VEG-001",
        "entityId": "mushroom",
        "kind": "MODIFIER",
        "displayName": "Mushroom",
        "message": "Mushroom topping is temporarily unavailable.",
    }
    assert client.get("/api/v1/cart").json()["items"][0]["id"] == line_id
