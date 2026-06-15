# Minimal, easily-scannable image: a static site served by nginx.
# The point of this repo is the *pipeline* around the image (scan → SBOM → sign →
# deploy → verify), so the app itself is intentionally tiny.
FROM nginx:1.27-alpine
COPY site/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
