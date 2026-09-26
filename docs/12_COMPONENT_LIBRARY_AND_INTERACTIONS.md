# Component Library and Interaction Rules

## Shared layout components
- AppShell
- PageHeader
- BottomNav
- StickyBottomAction
- FloatingCartPill
- Drawer
- BottomSheet
- CenterDialog
- FullScreenFlow

## Shared controls
- PrimaryButton
- SecondaryButton
- IconButton
- QuantityStepper
- SegmentedControl
- Chip
- Switch
- RadioCard
- CheckboxRow
- TextInput
- OTPInput

## Customer components
- FulfillmentSelector
- DynamicHero
- CategoryTile
- ProductCard
- ProductCutoutCard
- ProductMacroCard
- ModifierGroup
- BuildProgress
- CartItem
- ThresholdBar
- PointsSummary
- TierPill
- MembershipCard
- TierProgress
- WaveIdCard
- OrderTimeline
- OrderStatusHero
- SavedOrderCard
- ReferralCard
- CelebrationCard
- ChatLauncher
- ChatQuickReplies

## Owner components
- KpiStrip
- StoreModeControls
- LiveOrderCard
- ReviewOrderCard
- AttentionItem
- KitchenHealthCard
- Customer360Drawer
- AvailabilityDrawer
- RefundDialog
- RejectOrderDialog
- SupportConversationPanel
- AuditTimeline
- ConfigSection

## KDS components
- KitchenQueueColumn
- KitchenOrderCard
- PrepTimer
- PrepOverrideSheet
- CriticalModifier
- ProblemReportSheet
- AvailabilityToggle
- KdsStatusHeader

## Interaction rules

### Add to Cart
- compact spring
- plus becomes stepper
- cart count updates

### Fulfillment switch
- preserve cart
- backend re-quote
- warn only if fee/offer changes

### Availability change
Never silently remove a selected option.
Show a clear bottom sheet and let customer update/remove.

### Owner destructive action
Always show:
- what will happen
- financial implication
- customer impact
- final confirmation

### KDS prep override
Always show:
- system estimate
- new estimate
- reason
- customer ETA impact note

### Tier up
Small celebratory moment, under 650ms.
No forced upsell immediately after tier upgrade.

## Accessibility
- 44px minimum touch target
- visible focus
- high contrast
- no color-only status
- reduced motion
- keyboard-friendly owner UI
- large KDS controls

## Loading
Use cream-toned skeletons.
No full-screen loader after the app shell unless payment verification requires it.
