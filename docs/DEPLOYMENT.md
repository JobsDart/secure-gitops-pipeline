# Deployment & Demo Guide

## Enable the pipeline
1. Push this repo to `github.com/JobsDart/secure-gitops-pipeline`.
2. Add secrets: `SLACK_WEBHOOK` (required for notify), optionally `ARGOCD_SERVER`,
   `ARGOCD_AUTH_TOKEN`, `TARGET_URL`. No signing key is needed (keyless OIDC).
3. Push to `main` → the pipeline builds, scans, signs, deploys and tests.

## Install the admission policy (cluster)
```bash
# Kyverno must be installed in the cluster first.
kubectl apply -f policy/kyverno-verify-images.yaml
```
Now only images signed by this repo's workflow identity can run.

## Deploy the app via GitOps
```bash
kubectl apply -f gitops/argocd-application.yaml   # ArgoCD syncs gitops/manifests/
```

## Demonstrating a failing gate

### 1. Trivy blocks a vulnerable image
Temporarily change `app/Dockerfile` to an old, known-vulnerable base, e.g.:
```dockerfile
FROM nginx:1.20.0    # old — carries fixable HIGH/CRITICAL CVEs
```
Open a PR. The **Trivy image scan** step fails with a non-zero exit code, the PR check goes red, and
the findings appear under the repo's **Security → Code scanning** tab (uploaded SARIF). Revert to
`nginx:1.27-alpine` and the gate passes.

### 2. Kyverno rejects an unsigned image
With the policy installed, try to run an unsigned image:
```bash
kubectl run rogue --image=ghcr.io/jobsdart/secure-gitops-pipeline:unsigned -n secure-app
# Error from server: admission webhook "mutate.kyverno.svc" denied the request:
#   image is not signed by the trusted identity
```
This is the run-time half of the control — even a valid registry push can't reach production unsigned.

## Verify a signature manually
```bash
cosign verify ghcr.io/jobsdart/secure-gitops-pipeline:<sha> \
  --certificate-identity-regexp "https://github.com/JobsDart/secure-gitops-pipeline/.*" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```
