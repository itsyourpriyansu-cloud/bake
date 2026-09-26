# Pizza Wave implementation architecture

The frozen numbered blueprint files remain unchanged. This document records the implemented
frontend/backend boundary.

```text
pizza_wave_v1/
  src/                         React frontend (existing Vite hosting root)
    app/                       Router and providers
    domain/                    Pure typed business rules
    features/                  Query hooks and feature components
    services/api/              `/api/v1` transport adapters
    stores/                    Short-lived interaction state only
    prototype/                 MSW + Dexie deterministic demo adapter
    surfaces/                  Customer, Owner and KDS route surfaces
  backend/
    app/api/routes/            FastAPI transport controllers
    app/domain/                Pure cart identity and money rules
    app/models/                SQLAlchemy persistence models
    app/schemas/               Pydantic request/response contracts
    app/repositories/          Database access
    app/services/              Catalog, customization, cart and quote orchestration
    alembic/                   PostgreSQL schema migrations
    tests/                     API and domain integration tests
```

The frontend stays at the repository root because the existing Vite, PWA, and Sites hosting
configuration already owns that location. Moving it into a nested directory would add risk
without improving separation. The new backend follows Amani's layered Python structure while
the existing React `domain → service → query → UI` boundary is preserved.

## Ordering rules

- A cart line is identified by product, normalized modifier selections, and normalized special
  instructions.
- Identical configurations merge; distinct configurations remain separate.
- Editing into an existing configuration merges the two lines safely.
- Quantity zero removes a line; quantity is capped at 99 by both request schema and service.
- Product, modifier, dependency, price, and availability checks are server-owned.
- Money is persisted and calculated in integer paise.
- Every commercial cart view is obtained from `POST /api/v1/cart/quote`.
- No item or modifier is silently removed when availability changes.

