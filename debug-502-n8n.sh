#!/bin/bash

# ============================================
# Script Debug 502 Bad Gateway - n8n.bez.vn
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Debug 502 Bad Gateway - n8n.bez.vn${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Vui lòng chạy script với sudo:${NC}"
    echo "sudo bash debug-502-n8n.sh"
    exit 1
fi

ISSUES_FOUND=0

echo -e "${CYAN}[1] Kiểm tra Nginx status${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx đang chạy${NC}"
else
    echo -e "${RED}✗ Nginx KHÔNG chạy${NC}"
    echo -e "${YELLOW}Đang start Nginx...${NC}"
    systemctl start nginx
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

echo -e "${CYAN}[2] Kiểm tra Nginx config${NC}"
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${GREEN}✓ Nginx config OK${NC}"
else
    echo -e "${RED}✗ Nginx config có lỗi:${NC}"
    nginx -t
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

echo -e "${CYAN}[3] Kiểm tra n8n service${NC}"
if systemctl list-units --type=service --all | grep -q "n8n.service"; then
    if systemctl is-active --quiet n8n; then
        echo -e "${GREEN}✓ n8n service đang chạy${NC}"
        systemctl status n8n --no-pager -l | head -10
    else
        echo -e "${RED}✗ n8n service KHÔNG chạy${NC}"
        echo -e "${YELLOW}Trạng thái:${NC}"
        systemctl status n8n --no-pager -l | head -15
        ISSUES_FOUND=$((ISSUES_FOUND + 1))

        echo ""
        echo -e "${YELLOW}Bạn có muốn start n8n không? (y/n)${NC}"
        read -r answer
        if [ "$answer" = "y" ]; then
            systemctl start n8n
            sleep 3
            systemctl status n8n --no-pager
        fi
    fi
else
    echo -e "${RED}✗ n8n service CHƯA được cài đặt${NC}"
    echo -e "${YELLOW}Kiểm tra xem n8n có chạy bằng Docker hay PM2...${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

echo -e "${CYAN}[4] Kiểm tra port 5678${NC}"
if netstat -tlnp 2>/dev/null | grep -q ":5678"; then
    echo -e "${GREEN}✓ Port 5678 đang listen${NC}"
    netstat -tlnp | grep ":5678"
else
    echo -e "${RED}✗ Port 5678 KHÔNG listen${NC}"
    echo -e "${YELLOW}n8n phải chạy và listen trên port 5678${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

echo -e "${CYAN}[5] Kiểm tra n8n process${NC}"
if ps aux | grep -v grep | grep -q "n8n"; then
    echo -e "${GREEN}✓ Tìm thấy n8n process:${NC}"
    ps aux | grep -v grep | grep "n8n"
else
    echo -e "${RED}✗ KHÔNG tìm thấy n8n process${NC}"
    echo -e "${YELLOW}Kiểm tra cách n8n được start (systemd, docker, pm2, npm)${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

echo -e "${CYAN}[6] Test connection đến backend${NC}"
if command -v curl &> /dev/null; then
    echo -e "${YELLOW}Testing http://localhost:5678/${NC}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/ 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "000" ]; then
        echo -e "${RED}✗ Không thể connect đến localhost:5678${NC}"
        echo -e "${YELLOW}n8n backend không phản hồi${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
        echo -e "${GREEN}✓ Backend phản hồi OK (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${YELLOW}⚠ Backend phản hồi HTTP $HTTP_CODE${NC}"
    fi
else
    echo -e "${YELLOW}⚠ curl không có sẵn, bỏ qua test${NC}"
fi
echo ""

echo -e "${CYAN}[7] Kiểm tra Nginx error log (10 dòng cuối)${NC}"
if [ -f /var/log/nginx/error.log ]; then
    echo -e "${YELLOW}Nginx error log:${NC}"
    tail -10 /var/log/nginx/error.log
else
    echo -e "${YELLOW}⚠ Không tìm thấy error log${NC}"
fi
echo ""

echo -e "${CYAN}[8] Kiểm tra n8n logs (10 dòng cuối)${NC}"
if systemctl list-units --type=service --all | grep -q "n8n.service"; then
    echo -e "${YELLOW}n8n service log:${NC}"
    journalctl -u n8n -n 10 --no-pager
elif [ -f /var/log/n8n.log ]; then
    echo -e "${YELLOW}n8n log file:${NC}"
    tail -10 /var/log/n8n.log
else
    echo -e "${YELLOW}⚠ Không tìm thấy n8n log${NC}"
fi
echo ""

echo -e "${CYAN}[9] Kiểm tra Docker (nếu n8n chạy trên Docker)${NC}"
if command -v docker &> /dev/null; then
    if docker ps | grep -q "n8n"; then
        echo -e "${GREEN}✓ Tìm thấy n8n Docker container:${NC}"
        docker ps | grep "n8n"
        echo ""
        echo -e "${YELLOW}n8n container logs (10 dòng cuối):${NC}"
        docker logs $(docker ps | grep n8n | awk '{print $1}') --tail 10
    else
        echo -e "${YELLOW}⚠ Không tìm thấy n8n container đang chạy${NC}"

        # Kiểm tra stopped containers
        if docker ps -a | grep -q "n8n"; then
            echo -e "${RED}✗ Tìm thấy n8n container nhưng đã stopped:${NC}"
            docker ps -a | grep "n8n"

            echo ""
            echo -e "${YELLOW}Bạn có muốn start container không? (y/n)${NC}"
            read -r answer
            if [ "$answer" = "y" ]; then
                CONTAINER_ID=$(docker ps -a | grep "n8n" | awk '{print $1}')
                docker start "$CONTAINER_ID"
                sleep 3
                docker ps | grep "n8n"
            fi
        fi
    fi
else
    echo -e "${YELLOW}⚠ Docker không có sẵn${NC}"
fi
echo ""

echo -e "${CYAN}[10] Kiểm tra firewall${NC}"
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        echo -e "${YELLOW}UFW firewall đang active:${NC}"
        ufw status | grep -E "5678|80|443"
    else
        echo -e "${GREEN}✓ UFW không active${NC}"
    fi
else
    echo -e "${YELLOW}⚠ UFW không có sẵn${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}              TÓM TẮT${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ Không phát hiện vấn đề rõ ràng${NC}"
    echo -e "${YELLOW}Nếu vẫn gặp lỗi 502, hãy:${NC}"
    echo "1. Restart n8n: sudo systemctl restart n8n"
    echo "2. Restart Nginx: sudo systemctl restart nginx"
    echo "3. Xem logs real-time: sudo journalctl -u n8n -f"
else
    echo -e "${RED}Phát hiện $ISSUES_FOUND vấn đề${NC}"
    echo ""
    echo -e "${YELLOW}Các bước khắc phục:${NC}"
    echo ""

    echo -e "${CYAN}Nếu n8n không chạy:${NC}"
    echo "  sudo systemctl start n8n"
    echo "  sudo systemctl enable n8n"
    echo ""

    echo -e "${CYAN}Nếu chưa có n8n service:${NC}"
    echo "  # Cài đặt n8n:"
    echo "  npm install n8n -g"
    echo "  # Hoặc dùng Docker:"
    echo "  docker run -d --name n8n -p 5678:5678 n8nio/n8n"
    echo ""

    echo -e "${CYAN}Nếu port 5678 không listen:${NC}"
    echo "  # Kiểm tra n8n config"
    echo "  # Đảm bảo n8n bind đúng port 5678"
    echo ""
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}            LỆNH HỮU ÍCH${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}Xem logs real-time:${NC}"
echo "  sudo journalctl -u n8n -f                    # n8n service log"
echo "  sudo tail -f /var/log/nginx/error.log        # Nginx error log"
echo "  docker logs -f n8n                           # Docker container log"
echo ""
echo -e "${GREEN}Restart services:${NC}"
echo "  sudo systemctl restart n8n                   # Restart n8n service"
echo "  sudo systemctl restart nginx                 # Restart Nginx"
echo "  docker restart n8n                           # Restart Docker container"
echo ""
echo -e "${GREEN}Kiểm tra status:${NC}"
echo "  sudo systemctl status n8n                    # n8n service status"
echo "  sudo netstat -tlnp | grep 5678               # Port 5678 status"
echo "  curl -I http://localhost:5678/               # Test backend directly"
echo ""
