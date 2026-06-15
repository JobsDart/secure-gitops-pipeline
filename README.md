# Secure GitOps Pipeline

> A supply-chain-secure delivery pipeline for regulated environments: every commit is **scanned
> (Trivy)**, gets an **SBOM (Syft)**, is **cryptographically signed (Cosign, keyless)**, deployed via
> **GitOps (ArgoCD)**, **load-tested (k6)**, and reported to **Slack** — and the cluster **admits only
> signed images (Kyverno)**. Security is a set of automated gates, not a manual checklist.

<p align="center">
  <img alt="GitHub Actions" src="https://img.shields.io/badge/CI-GitHub%20Actions-2088FF">
  <img alt="Trivy" src="https://img.shields.io/badge/Scan-Trivy-1904DA">
  <img alt="Cosign" src="https://img.shields.io/badge/Sign-Cosign-2F6FEF">
  <img alt="ArgoCD" src="https://img.shields.io/badge/GitOps-ArgoCD-EF7B4D">
  <img alt="k6" src="https://img.shields.io/badge/Load-k6-7D64FF">
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green">
  <a href="https://github.com/JobsDart/secure-gitops-pipeline/actions"><img alt="Pipeline" src="https://github.com/JobsDart/secure-gitops-pipeline/actions/workflows/secure-pipeline.yaml/badge.svg"></a>
</p>

---

## Why this matters

In regulated industries (banking, insurance, healthcare — BaFin/BAIT, MiFID II) you must *prove* what
ran in production and that it was unaltered. This pipeline turns those obligations into enforced,
auditable automation: a developer **cannot** ship a vulnerable or unsigned image even if they try.

## The gates

```mermaid
flowchart LR
    A[commit] --> B[Build image]
    B --> C{Trivy scan<br/>HIGH/CRITICAL?}
    C -- found --> X[❌ fail]
    C -- clean --> D[SBOM - Syft]
    D --> E[Push to GHCR]
    E --> F[Cosign sign + attest SBOM]
    F --> G[ArgoCD sync]
    G --> H{k6 smoke<br/>SLO met?}
    H -- no --> X
    H -- yes --> I[✅ Slack: success]
    subgraph Cluster
      K[Kyverno: admit only signed images]
    end
    F -. signature .-> K
```

| Gate | Tool | Fails the build when… |
|------|------|------------------------|
| 1 · Vulnerability scan | **Trivy** | a HIGH/CRITICAL, fixable CVE is found |
| 2 · Provenance | **Syft + Cosign** | (produces SBOM + keyless signature + attestation) |
| 3 · Runtime health | **k6** | error rate ≥ 1% or p95 latency ≥ 500ms |
| Admission | **Kyverno** | an image isn't signed by *this* pipeline's identity |

---

## Repository layout

```
secure-gitops-pipeline/
├── app/                              # Tiny scannable image (nginx static site)
├── .github/workflows/
│   └── secure-pipeline.yaml          # build → scan → SBOM → sign → deploy → k6 → Slack
├── policy/kyverno-verify-images.yaml # cluster admits only Cosign-signed images
├── load/smoke.js                     # k6 smoke/load test with SLO thresholds
├── gitops/
│   ├── argocd-application.yaml        # ArgoCD app (auto-sync, self-heal)
│   └── manifests/                     # the deployed Deployment + Service
└── docs/                             # architecture, the failing-gate walkthrough, ADRs
```

---

## See a gate fail (the important demo)

Security gates only matter if you can show them blocking a bad change. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#demonstrating-a-failing-gate) for two reproducible failures:
1. **Vulnerable base image** → Trivy fails the build (with the SARIF shown in GitHub code scanning).
2. **Unsigned image** → Kyverno rejects the Pod at admission.

## Required secrets / setup
`SLACK_WEBHOOK`, optional `ARGOCD_SERVER` / `ARGOCD_AUTH_TOKEN`, `TARGET_URL`. Keyless Cosign signing
needs no key — it uses the workflow's GitHub OIDC identity (`id-token: write`).

---

## Documentation
- [Architecture](docs/ARCHITECTURE.md) · [Deployment & failing-gate demo](docs/DEPLOYMENT.md) · [Debugging](docs/DEBUGGING.md) · [ADRs](docs/adr/)

## License
[MIT](LICENSE) © JobsDart. Uses open-source Trivy, Syft, Cosign, ArgoCD, Kyverno and k6 (each under its own license).
