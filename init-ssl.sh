#!/bin/bash
# ============================================================
#  init-ssl.sh — First-time SSL certificate setup
#  Run this ONCE on the server: bash init-ssl.sh
# ============================================================

set -e

DOMAIN="lightweight.daw.inspedralbes.cat"
EMAIL="a20valzavvas@inspedralbes.cat"

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> 1. Starting nginx (HTTP only) for ACME challenge..."

# Temporarily use an HTTP-only nginx config so it can start without certs
cat > /tmp/nginx-init.conf << 'TMPCONF'
server {
  listen 80;
  server_name _;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 200 'SSL init in progress...';
    add_header Content-Type text/plain;
  }
}
TMPCONF

# Override nginx config temporarily
docker run -d --name lw-nginx-init \
  -p 80:80 \
  -v /tmp/nginx-init.conf:/etc/nginx/conf.d/default.conf:ro \
  -v lw-app_certbot_www:/var/www/certbot \
  nginx:alpine

echo "==> 2. Requesting certificate from Let's Encrypt..."

docker run --rm \
  -v lw-app_certbot_www:/var/www/certbot \
  -v lw-app_certbot_conf:/etc/letsencrypt \
  certbot/certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal

echo "==> 3. Stopping temporary nginx..."
docker stop lw-nginx-init && docker rm lw-nginx-init

echo "==> 4. Starting full stack with SSL..."
cd /opt/lw-app
$COMPOSE down
$COMPOSE up -d --build

echo ""
echo "✅ Done! https://$DOMAIN should now work."
echo "   Certbot will auto-renew every 12h via the certbot container."
