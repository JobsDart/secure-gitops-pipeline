# Architecture

## Threat model addressed
| Threat | Control in this pipeline |
|--------|--------------------------|
| Shipping known-vulnerable dependencies | Trivy scan gate (HIGH/CRITICAL → fail) |
| "What exactly is in this image?" (audit) | Syft SBOM, attached as a Cosign attestation |
| Tampered/forged image in the registry | Cosign keyless signature + Kyverno admission verify |
| Unknown who/what built it | GitHub OIDC identity is the signing subject (provenance) |
| Broken release reaching users | k6 smoke test gate (error rate + latency SLO) |
| Silent failures | Slack notification on every run |

## Pipeline stages
1. **Build** the image (loaded locally so it can be scanned before any push).
2. **Scan** with Trivy; upload SARIF to GitHub code scanning; fail on fixable HIGH/CRITICAL.
3. **SBOM** with Syft (SPDX JSON).
4. **Push** to GHCR (only from `main`, after gates pass).
5. **Sign + attest** with Cosign keyless (OIDC) — signature and SBOM attestation in the registry.
6. **Deploy** via ArgoCD (GitOps).
7. **Verify** with k6 against SLO thresholds.
8. **Notify** Slack with the result.

## Defense in depth: build-time *and* run-time
The pipeline signs at build time; the cluster **verifies at admission time** via the Kyverno policy in
`policy/`. Even if an attacker pushed a malicious image to GHCR, it wouldn't carry a signature from the
pipeline's OIDC identity, so Kyverno would refuse to schedule it. See
[ADR-0001](adr/0001-keyless-signing.md) and [ADR-0002](adr/0002-fail-closed-gates.md).

## Least privilege
The workflow declares the minimum token permissions it needs: `contents: read`, `packages: write`
(push), `id-token: write` (keyless signing), `security-events: write` (SARIF). Nothing more.
