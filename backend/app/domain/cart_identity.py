import json

from app.schemas.cart import ModifierSelection


def normalize_note(note: str | None) -> str:
    return " ".join((note or "").strip().split())


def normalize_selections(selections: list[ModifierSelection]) -> list[ModifierSelection]:
    return sorted(
        [
            ModifierSelection(group_id=item.group_id, option_ids=sorted(set(item.option_ids)))
            for item in selections
            if item.option_ids
        ],
        key=lambda item: item.group_id,
    )


def configuration_key(
    product_id: str, selections: list[ModifierSelection], special_instructions: str | None
) -> str:
    canonical = {
        "productId": product_id,
        "modifiers": [item.model_dump(by_alias=True) for item in normalize_selections(selections)],
        "specialInstructions": normalize_note(special_instructions).casefold(),
    }
    return json.dumps(canonical, ensure_ascii=True, separators=(",", ":"), sort_keys=True)
