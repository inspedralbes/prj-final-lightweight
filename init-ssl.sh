#!/bin/bash
# ============================================================
#  init-ssl.sh — First-time SSL certificate setup
#  Run this ONCE on the server: bash init-ssl.sh
# ============================================================

set -e

DOMAIN="lightweight.daw.inspedralbes.cat"
EMAIL="a20valzavvas@inspedralbes.cat"

COMPOSE="docker compose -f docker-compose.prod.yml"

# Volume names must match docker-compose.prod.yml (project name = folder name)
VOL_WWW="lw-app_certbot_www"
VOL_CONF="lw-app_certbot_conf"

echo "==> 0. Stopping existing stack (if running)..."
cd /opt/lw-app
$COMPOSE down 2>/dev/null || true
# Also remove any leftover temp container
docker stop lw-nginx-init 2>/dev/null && docker rm lw-nginx-init 2>/dev/null || true

echo "==> 1. Starting temporary nginx (HTTP only) for ACME challenge..."

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

docker run -d --name lw-nginx-init \
  -p 80:80 \
  -v /tmp/nginx-init.conf:/etc/nginx/conf.d/default.conf:ro \
  -v ${VOL_WWW}:/var/www/certbot \
  nginx:alpine

# Wait a moment for nginx to be ready
sleep 2

echo "==> 2. Requesting certificate from Let's Encrypt..."

docker run --rm \
  -v ${VOL_WWW}:/var/www/certbot \
  -v ${VOL_CONF}:/etc/letsencrypt \
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
$COMPOSE up -d --build

echo ""
echo "✅ Done! https://$DOMAIN should now work."
echo "   Certbot will auto-renew every 12h via the certbot container."
