# 🔧 Troubleshooting n8n.bez.vn

Hướng dẫn tổng hợp giải quyết các lỗi thường gặp với n8n.bez.vn sau khi cài SSL.

---

## 📋 Mục lục lỗi

1. [Lỗi: Trang welcome mặc định Nginx](#lỗi-1-trang-welcome-mặc-định)
2. [Lỗi: 502 Bad Gateway](#lỗi-2-502-bad-gateway) ← **Lỗi hiện tại**
3. [Lỗi: 504 Gateway Timeout](#lỗi-3-504-gateway-timeout)
4. [Lỗi: SSL/HTTPS không hoạt động](#lỗi-4-ssl-không-hoạt-động)
5. [Lỗi: WebSocket connection failed](#lỗi-5-websocket-failed)

---

## Lỗi 1: Trang welcome mặc định

### Triệu chứng
- HTTPS hoạt động
- Hiển thị trang "Welcome to nginx!"
- Không thấy n8n interface

### Nguyên nhân
Block HTTPS không có `proxy_pass`

### Giải pháp
```bash
sudo bash /home/user/bez/fix-nginx-n8n.sh
```

**Chi tiết:** Xem `FIX-NGINX-N8N-HTTPS.md`

---

## Lỗi 2: 502 Bad Gateway

### Triệu chứng
```
502 Bad Gateway
nginx/1.18.0 (Ubuntu)
```

### Nguyên nhân
n8n backend không chạy hoặc không phản hồi

### Giải pháp nhanh

**Option 1: Quick fix (1 phút)**
```bash
sudo bash /home/user/bez/quick-fix-502.sh
```

**Option 2: Debug đầy đủ**
```bash
sudo bash /home/user/bez/debug-502-n8n.sh
```

**Option 3: Manual fix**
```bash
# Restart n8n
sudo systemctl restart n8n

# Đợi n8n khởi động
sleep 5

# Check status
sudo systemctl status n8n

# Check port
sudo netstat -tlnp | grep 5678

# Restart Nginx
sudo systemctl restart nginx

# Test
curl https://n8n.bez.vn/
```

### Kiểm tra chi tiết

1. **n8n có chạy không?**
   ```bash
   sudo systemctl status n8n
   ```

2. **Port 5678 có listen không?**
   ```bash
   sudo netstat -tlnp | grep 5678
   ```

3. **Backend có phản hồi không?**
   ```bash
   curl http://localhost:5678/
   ```

4. **Xem logs**
   ```bash
   sudo journalctl -u n8n -f
   ```

**Chi tiết:** Xem `FIX-502-BAD-GATEWAY.md`

---

## Lỗi 3: 504 Gateway Timeout

### Triệu chứng
```
504 Gateway Timeout
```

### Nguyên nhân
n8n phản hồi quá chậm (> 60s)

### Giải pháp

Tăng timeout trong Nginx config:

```bash
sudo nano /etc/nginx/sites-available/n8n.bez.vn
```

Thêm vào block `location /`:

```nginx
location / {
    proxy_pass http://localhost:5678;

    # Tăng timeouts
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # ... các settings khác
}
```

Test và reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Lỗi 4: SSL không hoạt động

### Triệu chứng
- HTTPS không load
- "Connection not secure"
- Certificate error

### Giải pháp

1. **Kiểm tra certificate**
   ```bash
   sudo certbot certificates
   ```

2. **Renew certificate**
   ```bash
   sudo certbot renew
   ```

3. **Test SSL**
   ```bash
   bash /home/user/bez/check-ssl-health.sh n8n.bez.vn
   ```

---

## Lỗi 5: WebSocket failed

### Triệu chứng
- n8n login được
- Workflows không chạy
- Console error: "WebSocket connection failed"

### Nguyên nhân
Thiếu WebSocket headers trong Nginx config

### Giải pháp

Đảm bảo Nginx config có:

```nginx
location / {
    proxy_pass http://localhost:5678;
    proxy_http_version 1.1;

    # WebSocket headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
}
```

Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🎯 Quick Reference - Scripts

### Fix trang welcome → n8n
```bash
sudo bash /home/user/bez/fix-nginx-n8n.sh
```

### Fix lỗi 502 (quick)
```bash
sudo bash /home/user/bez/quick-fix-502.sh
```

### Debug lỗi 502 (chi tiết)
```bash
sudo bash /home/user/bez/debug-502-n8n.sh
```

### Check SSL health
```bash
bash /home/user/bez/check-ssl-health.sh n8n.bez.vn
```

---

## 🔍 Debug Commands

### Xem logs real-time

```bash
# n8n logs
sudo journalctl -u n8n -f

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# n8n-specific Nginx log
sudo tail -f /var/log/nginx/n8n.bez.vn.error.log
```

### Check services

```bash
# n8n status
sudo systemctl status n8n

# Nginx status
sudo systemctl status nginx

# Ports
sudo netstat -tlnp | grep -E "5678|80|443"

# Processes
ps aux | grep n8n
ps aux | grep nginx
```

### Test connections

```bash
# Test n8n backend
curl http://localhost:5678/

# Test through Nginx (local)
curl http://localhost/ -H "Host: n8n.bez.vn"

# Test HTTPS
curl https://n8n.bez.vn/

# Test with verbose
curl -v https://n8n.bez.vn/
```

---

## ✅ Full Health Check

Chạy lần lượt các lệnh này:

```bash
# 1. Services running?
sudo systemctl status nginx
sudo systemctl status n8n

# 2. Ports listening?
sudo netstat -tlnp | grep -E "80|443|5678"

# 3. Backend OK?
curl -I http://localhost:5678/

# 4. Nginx config OK?
sudo nginx -t

# 5. SSL OK?
bash /home/user/bez/check-ssl-health.sh n8n.bez.vn

# 6. HTTPS OK?
curl -I https://n8n.bez.vn/

# 7. Logs clean?
sudo journalctl -u n8n -n 10
sudo tail -10 /var/log/nginx/error.log
```

Nếu tất cả đều OK → Website hoạt động ✅

---

## 🆘 Vẫn không fix được?

### Thu thập debug info

```bash
# Chạy debug script và lưu output
sudo bash /home/user/bez/debug-502-n8n.sh > /tmp/debug-output.txt 2>&1

# Xem output
cat /tmp/debug-output.txt
```

### Restart toàn bộ hệ thống

```bash
# Nuclear option - restart everything
sudo systemctl restart n8n
sleep 5
sudo systemctl restart nginx
sleep 2
curl https://n8n.bez.vn/
```

### Factory reset Nginx config

```bash
# Backup config hiện tại
sudo cp /etc/nginx/sites-available/n8n.bez.vn /tmp/n8n.bez.vn.backup

# Chạy lại fix script
sudo bash /home/user/bez/fix-nginx-n8n.sh

# Test
curl https://n8n.bez.vn/
```

---

## 📚 Tài liệu chi tiết

- **Fix HTTPS proxy:** `FIX-NGINX-N8N-HTTPS.md`
- **Fix 502 error:** `FIX-502-BAD-GATEWAY.md`
- **SSL setup:** `SSL-SETUP-GUIDE.md`
- **Quick SSL:** `QUICK-SSL-SETUP.md`

---

## 🎓 Hiểu rõ hơn về kiến trúc

```
Browser (HTTPS)
    ↓
Nginx (port 443)
    ↓ proxy_pass
n8n Backend (port 5678)
    ↓
Database (SQLite)
```

**Để website hoạt động cần:**
1. ✅ Nginx running và config đúng
2. ✅ SSL certificate valid
3. ✅ n8n service running
4. ✅ n8n listen port 5678
5. ✅ proxy_pass trong cả 2 blocks (HTTP & HTTPS)

**Nếu thiếu 1 trong các điều trên → Lỗi**

---

## 💡 Tips

### Auto-restart n8n khi crash

```bash
# Edit service file
sudo nano /etc/systemd/system/n8n.service
```

Thêm:
```ini
[Service]
Restart=always
RestartSec=10
```

Reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart n8n
```

### Monitor n8n uptime

```bash
# Tạo cron job check health
crontab -e
```

Thêm:
```bash
*/5 * * * * curl -s http://localhost:5678/ > /dev/null || systemctl restart n8n
```

### Email alert khi n8n down

```bash
# Cài mailutils
sudo apt install mailutils

# Script check
echo '#!/bin/bash
if ! curl -s http://localhost:5678/ > /dev/null; then
    echo "n8n is down!" | mail -s "n8n Alert" your@email.com
    systemctl restart n8n
fi' | sudo tee /usr/local/bin/check-n8n.sh

sudo chmod +x /usr/local/bin/check-n8n.sh

# Cron job
*/5 * * * * /usr/local/bin/check-n8n.sh
```

---

**Chúc bạn troubleshoot thành công! 🚀**
