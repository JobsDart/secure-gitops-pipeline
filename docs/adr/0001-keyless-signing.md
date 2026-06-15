# ADR-0001: Keyless image signing with Cosign (OIDC)

- **Status:** Accepted
- **Date:** 2026-06-14

## Context
Images must be signed so the cluster can verify provenance. Traditional signing uses a long-lived
private key, which must be stored, rotated and protected — itself a liability.

## Decision
Use **Cosign keyless signing**: the GitHub Actions workflow signs using a short-lived certificate tied
to its **OIDC identity** (issuer `token.actions.githubusercontent.com`, subject = the workflow path).
The signature is recorded in the Rekor transparency log.

## Rationale
- No private key to store, leak or rotate — removes an entire class of secret-management risk.
- The signing identity *is* the build provenance: "signed by this repo's main-branch workflow" is
  verifiable and meaningful.

## Consequences
- ✅ No key management; strong, verifiable provenance; transparency-log auditability.
- ✅ Verification (Cosign, Kyverno) keys off identity, not a public key file.
- ⚠️ Requires `id-token: write` and GitHub-issued OIDC tokens (so signing happens on push, not on
   untrusted fork PRs). Acceptable — releases come from `main`.
