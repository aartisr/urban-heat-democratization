# Phase 5: Contribution Network Readiness

## Status

**Preparation available — no observation, partner handoff, or pilot registry is
stored by the app yet.** The browser-only contribution draft helps a person
frame non-identifying evidence. It must be reviewed by a real local steward
before any claim is published or acted upon.

The canonical phase status and all remaining release gates live in
[Address-Level Spectral Urbanism Advice](ADDRESS_LEVEL_SPECTRAL_URBANISM_ADVICE.md#current-delivery-status-and-what-remains).

## Contribution contract

Every shared observation must include:

- a bounded **claim to verify**, not a conclusion;
- an approximate public place description only—never a home address;
- date / time and a plain-language observation;
- what may be missing or uncertain;
- a proposed responsible steward; and
- one bounded request, such as a site visit, shade audit, maintenance review,
  cooling-resource update, or pilot-feasibility discussion.

Do not include faces, unit numbers, medical information, tenancy details,
immigration information, or any personally identifying information in the
observation or its attachments.

## Pilot registry contract

A pilot may appear in the public registry only after the Phase 3 readiness
gates are satisfied. Each entry must record:

```json
{
  "id": "public, non-address identifier",
  "status": "proposed | approved | active | paused | complete | sunset",
  "public_interest_question": "...",
  "bounded_geography": "neighborhood or public corridor, not an address",
  "community_steward": "named organization",
  "decision_owner": "named public / institutional owner",
  "methods_version": "...",
  "equity_review_status": "pending | approved | paused",
  "feedback_url": "...",
  "learning_report_url": "..."
}
```

The registry must make pause, correction, suppression, and sunset decisions as
visible as approved work. It must never list personal addresses or infer a
person’s location.

## Learning-report contract

Every active or complete pilot publishes a short report answering:

1. What public-interest question did the pilot investigate?
2. What did the data and local review agree or disagree about?
3. What changed, if anything, because of the pilot?
4. What limits, harms, or unintended effects were found?
5. What should be revised, suppressed, or not repeated?

Negative or inconclusive findings are required learning outputs, not failures
to hide.

## Remaining external prerequisites

- A named community steward and accountable decision owner
- Partner-approved intake, moderation, retention, and incident process
- Accessible, multilingual feedback pathway
- Independent equity review and harm-monitoring plan
- Governance for publishing, correcting, pausing, and sunsetting registry
  entries
- Evidence that the network is useful and does not create unacceptable
  disparate harms
