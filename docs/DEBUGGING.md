# Debugging Guide

### Trivy step fails the build
Working as designed if there are fixable HIGH/CRITICAL CVEs. Read the SARIF in **Security → Code
scanning**, bump the offending package/base image, and re-run. `ignore-unfixed: true` means only CVEs
*with a fix available* fail the build.

### `cosign sign` fails with an OIDC error
Keyless signing needs `permissions: id-token: write` in the job (already set) and must run on
`push`/workflow events that GitHub issues OIDC tokens for (not from a fork PR). Check the job's token
permissions.

### Kyverno rejects an image that *should* be allowed
The `subject`/`issuer` in `policy/kyverno-verify-images.yaml` must match the signing identity exactly.
After changing the repo or branch, update the `subject` regex. Verify manually with `cosign verify`
(see DEPLOYMENT.md).

### k6 thresholds fail
`http_req_failed` or `p(95)` exceeded the SLO. Confirm `TARGET_URL` points at the deployed service and
that it's healthy; inspect the k6 summary in the job log. Adjust thresholds in `load/smoke.js` only if
the SLO itself changed.

### Slack step shows as failed
Check the `SLACK_WEBHOOK` secret is set and is an *incoming-webhook* URL. The step runs with
`if: always()` so it reports both success and failure.

### Image not found on deploy
The deploy uses the image pushed in the previous job. Ensure the `build-scan-sign` job pushed (only
happens on `main`) and that `gitops/manifests/deployment.yaml` references the right tag/digest.
