#!/bin/bash

# ============================================
# Script Fix Nginx Config cho n8n.bez.vn
# Vấn đề: HTTPS không có proxy_pass
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Fix Nginx Config - n8n.bez.vn${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Vui lòng chạy script với sudo:${NC}"
    echo "sudo bash fix-nginx-n8n.sh"
    exit 1
fi

DOMAIN="n8n.bez.vn"
CONFIG_FILE="/etc/nginx/sites-available/$DOMAIN"

# Kiểm tra file config có tồn tại không
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Không tìm thấy file config: $CONFIG_FILE${NC}"
    echo ""
    echo -e "${YELLOW}Tìm kiếm các file config khác...${NC}"
    ls -la /etc/nginx/sites-available/
    exit 1
fi

echo -e "${GREEN}✓ Tìm thấy config file: $CONFIG_FILE${NC}"
echo ""

# Backup file cũ
BACKUP_FILE="/etc/nginx/sites-available/$DOMAIN.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✓ Đã backup config cũ: $BACKUP_FILE${NC}"
echo ""

# Kiểm tra xem có proxy_pass trong block HTTPS không
echo -e "${BLUE}Kiểm tra config hiện tại...${NC}"
if grep -A 20 "listen 443" "$CONFIG_FILE" | grep -q "proxy_pass"; then
    echo -e "${GREEN}✓ HTTPS block đã có proxy_pass${NC}"
    echo -e "${YELLOW}Vui lòng kiểm tra log để tìm lỗi khác:${NC}"
    echo "sudo tail -f /var/log/nginx/error.log"
    exit 0
else
    echo -e "${RED}✗ HTTPS block KHÔNG có proxy_pass${NC}"
    echo -e "${YELLOW}Đang sửa...${NC}"
    echo ""
fi

# Tạo file config mới với proxy_pass đầy đủ
cat > "$CONFIG_FILE" <<'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;

    server_name n8n.bez.vn;

    # Certbot will add location for ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Main Config
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name n8n.bez.vn;

    # SSL Configuration (Certbot managed)
    ssl_certificate /etc/letsencrypt/live/n8n.bez.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.bez.vn/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/n8n.bez.vn.access.log;
    error_log /var/log/nginx/n8n.bez.vn.error.log;

    # Increase client body size for file uploads
    client_max_body_size 100M;

    # Proxy to n8n application
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;

        # WebSocket support (required for n8n)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        proxy_cache_bypass $http_upgrade;

        # Timeouts (important for long-running workflows)
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        # Buffer settings
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Health check endpoint
    location /healthz {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo -e "${GREEN}✓ Đã tạo config mới với proxy_pass đầy đủ${NC}"
echo ""

# Test config
echo -e "${BLUE}Testing Nginx config...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Config syntax OK${NC}"
    echo ""

    # Reload Nginx
    echo -e "${BLUE}Reloading Nginx...${NC}"
    systemctl reload nginx

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
        echo ""
        echo -e "${GREEN}================================================${NC}"
        echo -e "${GREEN}           SỬA XONG! ✅${NC}"
        echo -e "${GREEN}================================================${NC}"
        echo ""
        echo -e "Kiểm tra trang web: ${BLUE}https://n8n.bez.vn/${NC}"
        echo ""
        echo -e "${YELLOW}Nếu vẫn lỗi, kiểm tra:${NC}"
        echo "1. n8n có đang chạy không: ${GREEN}sudo systemctl status n8n${NC}"
        echo "2. n8n có listen port 5678 không: ${GREEN}sudo netstat -tlnp | grep 5678${NC}"
        echo "3. Xem Nginx error log: ${GREEN}sudo tail -f /var/log/nginx/error.log${NC}"
        echo "4. Xem n8n log: ${GREEN}sudo journalctl -u n8n -f${NC}"
        echo ""
        echo -e "${YELLOW}File backup:${NC} $BACKUP_FILE"
        echo ""
    else
        echo -e "${RED}✗ Lỗi khi reload Nginx${NC}"
        echo -e "${YELLOW}Khôi phục file cũ...${NC}"
        cp "$BACKUP_FILE" "$CONFIG_FILE"
        systemctl reload nginx
        exit 1
    fi
else
    echo -e "${RED}✗ Config syntax lỗi!${NC}"
    echo -e "${YELLOW}Khôi phục file cũ...${NC}"
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    exit 1
fi
