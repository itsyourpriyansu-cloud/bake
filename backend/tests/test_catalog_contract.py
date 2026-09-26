from fastapi.testclient import TestClient


def test_menu_and_product_contracts_match_the_react_client(client: TestClient) -> None:
    menu = client.get("/api/v1/menu")
    assert menu.status_code == 200
    assert len(menu.json()["products"]) == 12
    pizza = next(item for item in menu.json()["products"] if item["id"] == "PIZZA-VEG-001")
    assert len(pizza["modifierGroups"]) == 7
    assert pizza["price"] == 110.0

    detail = client.get("/api/v1/products/PIZZA-PANEER-001")
    assert detail.status_code == 200
    assert detail.json()["pointsPreview"] == 9
    assert len(detail.json()["pairings"]) == 2


def test_demo_search_terms_are_supported(client: TestClient) -> None:
    assert client.get("/api/v1/search", params={"q": "paneer"}).json()
    under = client.get("/api/v1/search", params={"q": "under 200"}).json()
    assert under
    assert all(product["price"] < 200 for product in under)
