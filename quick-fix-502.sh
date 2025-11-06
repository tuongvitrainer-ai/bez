#!/bin/bash

# ============================================
# Quick Fix 502 - n8n.bez.vn
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Quick Fix 502 Bad Gateway - n8n.bez.vn${NC}"
echo ""

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Vui lòng chạy với sudo:${NC}"
    echo "sudo bash quick-fix-502.sh"
    exit 1
fi

echo -e "${YELLOW}[1] Restarting n8n service...${NC}"
systemctl restart n8n

echo -e "${YELLOW}[2] Waiting for n8n to start (5 seconds)...${NC}"
sleep 5

echo -e "${YELLOW}[3] Checking n8n status...${NC}"
if systemctl is-active --quiet n8n; then
    echo -e "${GREEN}✓ n8n is running${NC}"
else
    echo -e "${RED}✗ n8n failed to start${NC}"
    echo -e "${YELLOW}Check logs: sudo journalctl -u n8n -n 20${NC}"
    exit 1
fi

echo -e "${YELLOW}[4] Checking port 5678...${NC}"
if netstat -tlnp 2>/dev/null | grep -q ":5678"; then
    echo -e "${GREEN}✓ Port 5678 is listening${NC}"
else
    echo -e "${RED}✗ Port 5678 is not listening${NC}"
    exit 1
fi

echo -e "${YELLOW}[5] Testing backend...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo -e "${GREEN}✓ Backend responds (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Backend not responding (HTTP $HTTP_CODE)${NC}"
    exit 1
fi

echo -e "${YELLOW}[6] Restarting Nginx...${NC}"
systemctl restart nginx

echo -e "${YELLOW}[7] Testing HTTPS...${NC}"
sleep 2
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://n8n.bez.vn/ 2>/dev/null || echo "000")

echo ""
if [ "$HTTPS_CODE" = "200" ] || [ "$HTTPS_CODE" = "302" ] || [ "$HTTPS_CODE" = "301" ]; then
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}           ✓ FIXED! (HTTP $HTTPS_CODE)${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "Truy cập: ${GREEN}https://n8n.bez.vn/${NC}"
    exit 0
else
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}        ✗ Still getting error (HTTP $HTTPS_CODE)${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
    echo -e "${YELLOW}Chạy script debug đầy đủ:${NC}"
    echo "sudo bash /home/user/bez/debug-502-n8n.sh"
    exit 1
fi
