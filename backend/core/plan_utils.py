"""
Plan limit helpers.
"""
from decimal import Decimal
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..models import models


DEFAULT_PLANS = {
    "basic": {
        "plan_code": "Basic",
        "plan_name": "Basic",
        "base_seats": 5,
        "base_price": Decimal("600000"),
        "addon_price_per_seat": Decimal("60000"),
    },
    "pro": {
        "plan_code": "Pro",
        "plan_name": "Pro",
        "base_seats": 10,
        "base_price": Decimal("1200000"),
        "addon_price_per_seat": Decimal("120000"),
    },
    "enterprise": {
        "plan_code": "Enterprise",
        "plan_name": "Enterprise",
        "base_seats": 30,
        "base_price": Decimal("3600000"),
        "addon_price_per_seat": Decimal("100000"),
    },
}


def _normalize_plan(plan_name: str | None) -> str:
    return (plan_name or "").strip().lower()


def get_plan_definition(db: Session, plan_name: str | None) -> dict | None:
    normalized = _normalize_plan(plan_name)
    if not normalized or normalized == "none":
        return None

    plan = (
        db.query(models.SubscriptionPlan)
        .filter(
            models.SubscriptionPlan.is_active == True,
            or_(
                func.lower(models.SubscriptionPlan.plan_code) == normalized,
                func.lower(models.SubscriptionPlan.plan_name) == normalized,
            ),
        )
        .first()
    )
    if plan:
        return {
            "plan_code": plan.plan_code,
            "plan_name": plan.plan_name,
            "base_seats": int(plan.base_seats or 0),
            "base_price": Decimal(plan.base_price or 0),
            "addon_price_per_seat": Decimal(plan.addon_price_per_seat or 0),
            "daily_token_limit": plan.daily_token_limit,
            "per_seat_token_bonus": plan.per_seat_token_bonus or 0,
        }

    return DEFAULT_PLANS.get(normalized)


def list_plan_definitions(db: Session) -> list[dict]:
    plans = (
        db.query(models.SubscriptionPlan)
        .filter(models.SubscriptionPlan.is_active == True)
        .order_by(models.SubscriptionPlan.base_price.asc())
        .all()
    )
    if plans:
        return [
            {
                "plan_code": plan.plan_code,
                "plan_name": plan.plan_name,
                "base_seats": int(plan.base_seats or 0),
                "base_price": Decimal(plan.base_price or 0),
                "addon_price_per_seat": Decimal(plan.addon_price_per_seat or 0),
                "daily_token_limit": plan.daily_token_limit,
                "per_seat_token_bonus": plan.per_seat_token_bonus or 0,
            }
            for plan in plans
        ]

    return list(DEFAULT_PLANS.values())


def get_plan_base_seats(db: Session, plan_name: str | None) -> int:
    plan = get_plan_definition(db, plan_name)
    if not plan:
        return 0

    return int(plan["base_seats"] or 0)


def calculate_plan_amount(db: Session, plan_name: str | None, added_seats: int = 0) -> Decimal:
    plan = get_plan_definition(db, plan_name)
    if not plan:
        return Decimal("0")

    safe_added_seats = max(0, int(added_seats or 0))
    return Decimal(plan["base_price"] or 0) + Decimal(plan["addon_price_per_seat"] or 0) * safe_added_seats


def get_latest_added_seats(db: Session, org_id: str) -> int:
    payment = (
        db.query(models.Payment)
        .filter(
            models.Payment.org_id == org_id,
            models.Payment.status.in_(["completed", "cancelling"]),
        )
        .order_by(models.Payment.created_at.desc())
        .first()
    )
    return int(payment.added_seats or 0) if payment else 0


def get_effective_max_seats(db: Session, org: models.Organization) -> int:
    base_seats = get_plan_base_seats(db, org.plan)
    if base_seats <= 0:
        return int(org.max_seats or 0)

    return base_seats + get_latest_added_seats(db, org.id)


def apply_plan_seats(db: Session, org: models.Organization) -> int:
    max_seats = get_effective_max_seats(db, org)
    org.max_seats = max_seats
    return max_seats
