#!/bin/bash

# ============================================
# Script cài đặt SSL miễn phí Let's Encrypt
# Cho Nginx trên Ubuntu 24.04
# ============================================

set -e

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Cài đặt SSL Let's Encrypt với Certbot${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Vui lòng chạy script với quyền sudo:${NC}"
    echo "sudo bash setup-ssl.sh"
    exit 1
fi

# Lấy thông tin domain
echo -e "${YELLOW}Nhập tên miền của bạn (ví dụ: example.com):${NC}"
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Tên miền không được để trống!${NC}"
    exit 1
fi

echo -e "${YELLOW}Nhập email để nhận thông báo từ Let's Encrypt:${NC}"
read -r EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email không được để trống!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Bước 1: Cập nhật hệ thống${NC}"
apt update

echo ""
echo -e "${GREEN}Bước 2: Cài đặt Nginx (nếu chưa có)${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}✓ Nginx đã được cài đặt${NC}"
else
    echo -e "${GREEN}✓ Nginx đã có sẵn${NC}"
fi

echo ""
echo -e "${GREEN}Bước 3: Cài đặt Certbot và plugin Nginx${NC}"
apt install -y certbot python3-certbot-nginx

echo ""
echo -e "${GREEN}Bước 4: Tạo file cấu hình Nginx cơ bản${NC}"
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    listen [::]:80;

    server_name $DOMAIN www.$DOMAIN;

    root /var/www/$DOMAIN;
    index index.html index.htm;

    location / {
        try_files \$uri \$uri/ =404;
    }

    # Nếu bạn đang chạy ứng dụng Node.js
    # Uncomment các dòng dưới và điều chỉnh port
    # location / {
    #     proxy_pass http://localhost:3000;
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade \$http_upgrade;
    #     proxy_set_header Connection 'upgrade';
    #     proxy_set_header Host \$host;
    #     proxy_cache_bypass \$http_upgrade;
    #     proxy_set_header X-Real-IP \$remote_addr;
    #     proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    #     proxy_set_header X-Forwarded-Proto \$scheme;
    # }
}
EOF

# Tạo thư mục web root
mkdir -p /var/www/$DOMAIN
echo "<h1>Welcome to $DOMAIN</h1>" > /var/www/$DOMAIN/index.html
chown -R www-data:www-data /var/www/$DOMAIN

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Xóa default site nếu tồn tại
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx

echo ""
echo -e "${GREEN}Bước 5: Lấy SSL certificate từ Let's Encrypt${NC}"
echo -e "${YELLOW}Certbot sẽ tự động cấu hình SSL cho Nginx...${NC}"
echo ""

# Lấy certificate và tự động cấu hình Nginx
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

echo ""
echo -e "${GREEN}Bước 6: Thiết lập auto-renewal${NC}"
# Certbot tự động tạo systemd timer cho renewal
systemctl status certbot.timer --no-pager

# Test renewal
echo -e "${YELLOW}Test renewal process...${NC}"
certbot renew --dry-run

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}           CÀI ĐẶT THÀNH CÔNG! 🎉${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Tên miền: ${GREEN}https://$DOMAIN${NC}"
echo -e "Certificate location: ${GREEN}/etc/letsencrypt/live/$DOMAIN/${NC}"
echo -e "Auto-renewal: ${GREEN}Enabled (chạy 2 lần/ngày)${NC}"
echo ""
echo -e "${YELLOW}Kiểm tra SSL của bạn tại:${NC}"
echo -e "https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo -e "${YELLOW}Các lệnh hữu ích:${NC}"
echo -e "  - Xem certificate info: ${GREEN}certbot certificates${NC}"
echo -e "  - Renew thủ công: ${GREEN}sudo certbot renew${NC}"
echo -e "  - Xem Nginx config: ${GREEN}cat /etc/nginx/sites-available/$DOMAIN${NC}"
echo -e "  - Test Nginx config: ${GREEN}sudo nginx -t${NC}"
echo -e "  - Reload Nginx: ${GREEN}sudo systemctl reload nginx${NC}"
echo ""
