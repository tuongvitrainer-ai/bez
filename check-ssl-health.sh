#!/bin/bash

# ============================================
# Script kiểm tra SSL Health Check
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}        SSL Health Check Tool${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Lấy domain từ argument hoặc hỏi người dùng
DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo -e "${YELLOW}Nhập tên miền cần kiểm tra:${NC}"
    read -r DOMAIN
fi

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Tên miền không được để trống!${NC}"
    exit 1
fi

echo -e "${GREEN}Đang kiểm tra: $DOMAIN${NC}"
echo ""

# 1. Kiểm tra DNS resolution
echo -e "${BLUE}[1] Kiểm tra DNS Resolution${NC}"
if nslookup $DOMAIN > /dev/null 2>&1; then
    IP=$(nslookup $DOMAIN | grep -A1 "Name:" | tail -1 | awk '{print $2}')
    echo -e "${GREEN}✓ DNS OK - IP: $IP${NC}"
else
    echo -e "${RED}✗ DNS FAILED${NC}"
    exit 1
fi
echo ""

# 2. Kiểm tra port 80
echo -e "${BLUE}[2] Kiểm tra Port 80 (HTTP)${NC}"
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$DOMAIN/80" 2>/dev/null; then
    echo -e "${GREEN}✓ Port 80 OPEN${NC}"
else
    echo -e "${RED}✗ Port 80 CLOSED${NC}"
fi
echo ""

# 3. Kiểm tra port 443
echo -e "${BLUE}[3] Kiểm tra Port 443 (HTTPS)${NC}"
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$DOMAIN/443" 2>/dev/null; then
    echo -e "${GREEN}✓ Port 443 OPEN${NC}"
else
    echo -e "${RED}✗ Port 443 CLOSED${NC}"
    exit 1
fi
echo ""

# 4. Kiểm tra HTTP to HTTPS redirect
echo -e "${BLUE}[4] Kiểm tra HTTP -> HTTPS Redirect${NC}"
REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" -L http://$DOMAIN)
if [ "$REDIRECT" = "200" ]; then
    LOCATION=$(curl -s -I http://$DOMAIN | grep -i location | awk '{print $2}' | tr -d '\r')
    if [[ $LOCATION == https://* ]]; then
        echo -e "${GREEN}✓ Redirect OK${NC}"
    else
        echo -e "${YELLOW}⚠ No redirect configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠ HTTP Code: $REDIRECT${NC}"
fi
echo ""

# 5. Kiểm tra SSL certificate
echo -e "${BLUE}[5] Kiểm tra SSL Certificate${NC}"
CERT_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Certificate VALID${NC}"

    # Issuer
    ISSUER=$(echo "$CERT_INFO" | grep "issuer" | cut -d'=' -f2-)
    echo -e "  Issuer: ${BLUE}$ISSUER${NC}"

    # Subject
    SUBJECT=$(echo "$CERT_INFO" | grep "subject" | cut -d'=' -f2-)
    echo -e "  Subject: ${BLUE}$SUBJECT${NC}"

    # Expiry date
    EXPIRY=$(echo "$CERT_INFO" | grep "notAfter" | cut -d'=' -f2)
    echo -e "  Expires: ${BLUE}$EXPIRY${NC}"

    # Days until expiry
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

    if [ $DAYS_LEFT -gt 30 ]; then
        echo -e "  Days left: ${GREEN}$DAYS_LEFT days${NC}"
    elif [ $DAYS_LEFT -gt 7 ]; then
        echo -e "  Days left: ${YELLOW}$DAYS_LEFT days (renew soon)${NC}"
    else
        echo -e "  Days left: ${RED}$DAYS_LEFT days (URGENT!)${NC}"
    fi
else
    echo -e "${RED}✗ Certificate INVALID${NC}"
fi
echo ""

# 6. Kiểm tra SSL protocol version
echo -e "${BLUE}[6] Kiểm tra SSL/TLS Protocol${NC}"
PROTOCOL=$(echo | openssl s_client -connect $DOMAIN:443 2>/dev/null | grep "Protocol" | awk '{print $3}')
if [ ! -z "$PROTOCOL" ]; then
    echo -e "  Protocol: ${GREEN}$PROTOCOL${NC}"
else
    echo -e "  ${RED}Cannot detect protocol${NC}"
fi
echo ""

# 7. Kiểm tra HSTS header
echo -e "${BLUE}[7] Kiểm tra HSTS (HTTP Strict Transport Security)${NC}"
HSTS=$(curl -s -I https://$DOMAIN | grep -i "strict-transport-security")
if [ ! -z "$HSTS" ]; then
    echo -e "${GREEN}✓ HSTS Enabled${NC}"
    echo -e "  $HSTS"
else
    echo -e "${YELLOW}⚠ HSTS Not configured${NC}"
fi
echo ""

# 8. Test với curl
echo -e "${BLUE}[8] Test HTTPS Connection${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ HTTPS OK (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠ HTTP Code: $HTTP_CODE${NC}"
fi
echo ""

# 9. Kiểm tra Certbot (nếu có quyền)
if [ "$EUID" -eq 0 ]; then
    echo -e "${BLUE}[9] Certbot Certificate Info${NC}"
    if command -v certbot &> /dev/null; then
        certbot certificates 2>/dev/null | grep -A5 "$DOMAIN" || echo -e "${YELLOW}⚠ No certbot certificate found${NC}"
    else
        echo -e "${YELLOW}⚠ Certbot not installed${NC}"
    fi
    echo ""
fi

# 10. SSL Labs link
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Kiểm tra SSL Rating đầy đủ tại:${NC}"
echo -e "${BLUE}https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN${NC}"
echo ""

echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}        Health Check Complete!${NC}"
echo -e "${BLUE}================================================${NC}"
