# Project Structure, Environment and Master Agent Context

## Recommended prototype structure

```text
pizza-wave/
  src/
    app/
      router/
      providers/

    surfaces/
      landing/
      customer/
      owner/
      kds/

    features/
      auth/
      catalog/
      product/
      cart/
      checkout/
      payments/
      orders/
      fulfillment/
      loyalty/
      crm/
      chat/
      support/
      availability/

    shared/
      components/
      hooks/
      types/
      utils/

    services/
      api/
      events/
      realtime/
      storage/

    stores/

    mocks/
      handlers/
      fixtures/
      db/
      seed/

    styles/

  public/
    assets/

  backend/
    README-future-backend.md
```

## Prototype env
```bash
VITE_APP_MODE=prototype
VITE_API_BASE=/api/v1
VITE_ENABLE_MSW=true
VITE_ENABLE_DEMO_TOOLS=true
VITE_PWA_SCOPE=/app/
```

Never use production secrets in Vite.

## Adapter interfaces
Create replaceable interfaces for:
- PaymentProvider
- ConversationChannel
- RealtimeTransport
- CustomerAuthProvider

Prototype:
- DemoPhonePeProvider
- DemoWhatsAppChannel
- DemoRealtimeTransport
- DemoOtpProvider

Production later:
- PhonePeProvider
- WhatsAppCloudChannel
- WebSocketTransport
- real OTP/Auth adapter

---

# MASTER AGENT SUMMARY

Read all blueprint files before coding.

Critical frozen rules:
1. `/` marketing.
2. `/app` customer PWA.
3. `/owner` founder.
4. `/kds` exactly three chef screens.
5. `/team` reserved.
6. `/api/v1` future backend.
7. Payment is confirmed before operational order.
8. Confirmed payment enters Awaiting Acceptance.
9. KDS receives only paid + accepted orders.
10. HYBRID acceptance is default.
11. Founder can accept/reject review orders.
12. Rejected paid order triggers refund simulation.
13. Customer chooses Delivery/Pickup.
14. System recommends kitchen timing.
15. Chef may change prep timing with reason.
16. Customer sees progress in real time.
17. Same customer identity across PWA and store.
18. In-store linking uses Wave ID or phone+OTP.
19. Loyalty is shared across channels.
20. Tier is derived.
21. Owner availability override beats chef.
22. Chat and WhatsApp share one conversation model.
23. Founder handles exceptions, not routine work.
24. All significant state transitions emit events.
25. UI consumes a mock API shaped like future FastAPI.
26. Food-first, Cream/Burgundy/Orange design language.
27. Phudu display, Poppins UI.
28. No glassmorphism, neon, heavy animation, or AI-SaaS visual clichés.
