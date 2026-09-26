from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models.cart import StoreConfig

router = APIRouter(tags=["system"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/capabilities")
def capabilities(session: Session = Depends(get_session)) -> dict[str, object]:
    store = session.get(StoreConfig, "STORE-PURI-GRAND-ROAD")
    if store is None:
        return {"storeOpen": False}
    return {
        "storeOpen": store.open,
        "delivery": {"enabled": store.open and store.delivery_enabled},
        "pickup": {"enabled": store.open and store.pickup_enabled},
        "storeOrder": {"enabled": store.open and store.store_order_enabled},
        "scheduledOrders": {"enabled": True},
        "pointsRedemption": {"enabled": True},
        "store": {
            "id": store.id,
            "name": store.name,
            "city": store.city,
            "acceptanceMode": store.acceptance_mode,
        },
    }
