#!/bin/bash
# init-ssl.sh — Run this ONCE on the VPS to obtain the first Let's Encrypt certificate.
# After this, docker-compose.prod.yml handles everything automatically.
#
# Usage:  bash init-ssl.sh

set -e

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> [1/4] Starting containers with HTTP-only Nginx config..."
# Temporarily use the HTTP-only config so Nginx can start without certs
cp nginx/default.conf nginx/default.conf.https.bak
cp nginx/default-init.conf nginx/default.conf

$COMPOSE up -d --build

echo "==> [2/4] Waiting for Nginx to be ready..."
sleep 5

echo "==> [3/4] Requesting Let's Encrypt certificate via certbot (webroot)..."
$COMPOSE --profile certbot run --rm certbot

echo "==> [4/4] Restoring HTTPS Nginx config and reloading..."
cp nginx/default.conf.https.bak nginx/default.conf
rm nginx/default.conf.https.bak

$COMPOSE exec nginx nginx -s reload

echo ""
echo "✅ Done! The site is now running on HTTPS."
echo "   https://lightweight.daw.inspedralbes.cat"
echo ""
echo "Add this to crontab (sudo crontab -e) for auto-renewal every Monday at 3am:"
echo "   0 3 * * 1 cd $(pwd) && docker compose -f docker-compose.prod.yml --profile certbot run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload"
