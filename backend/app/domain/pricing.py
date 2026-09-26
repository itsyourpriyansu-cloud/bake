from dataclasses import dataclass

TIER_RATE = {"MEMBER": 0.02, "SILVER": 0.03, "GOLD": 0.04, "PLATINUM": 0.05}


@dataclass(frozen=True)
class Redemption:
    usable: int
    value_paise: int
    warnings: list[str]


def calculate_redemption(
    requested: int, available: int, eligible_subtotal_paise: int
) -> Redemption:
    if requested == 0:
        return Redemption(0, 0, [])
    if requested < 50:
        return Redemption(0, 0, ["Minimum redemption is 50 points."])
    maximum = eligible_subtotal_paise // 500
    usable = min(requested, available, maximum)
    warnings = ["Points reduced to stay within redemption limits."] if usable < requested else []
    return Redemption(usable, usable * 100, warnings)


def points_to_earn(eligible_spend_paise: int, tier: str) -> int:
    return int((eligible_spend_paise / 100) * TIER_RATE.get(tier, TIER_RATE["MEMBER"]))


def rupees(paise: int) -> float:
    return paise / 100
