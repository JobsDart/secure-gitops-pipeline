# ADR-0002: Fail-closed security gates

- **Status:** Accepted
- **Date:** 2026-06-14

## Context
Security checks can be advisory (warn, but let the build through) or blocking (fail the build). In
regulated environments, advisory checks get ignored under delivery pressure.

## Decision
Make the gates **fail-closed**: Trivy runs with `exit-code: 1` on HIGH/CRITICAL; k6 uses hard
`thresholds`; Kyverno uses `validationFailureAction: Enforce`. A failing gate stops the release —
there is no "merge anyway" path in the automation.

## Rationale
- A control that can be silently skipped is not a control. Fail-closed makes compliance the default and
  bypassing it a visible, deliberate act (editing the workflow, which is itself reviewed).
- Mirrors real BAIT/MiFID-II expectations: demonstrable, enforced controls — not good intentions.

## Consequences
- ✅ Vulnerabilities, unsigned images and unhealthy releases are blocked automatically and auditably.
- ⚠️ A noisy or mis-tuned gate can block legitimate work. Mitigated with `ignore-unfixed: true` for
   Trivy and SLO-based (not arbitrary) k6 thresholds; tuning is a reviewed change, not an override.
