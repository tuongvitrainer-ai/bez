# 🚨 Fix lỗi 502 Bad Gateway - n8n.bez.vn

## ⚠️ Vấn đề

Trang https://n8n.bez.vn/ báo lỗi:
```
502 Bad Gateway
nginx/1.18.0 (Ubuntu)
```

## 🔍 Nguyên nhân

Lỗi **502 Bad Gateway** có nghĩa:
- ✅ Nginx đã nhận request từ browser
- ✅ Nginx đã cố gắng proxy đến backend (n8n)
- ❌ Backend **KHÔNG phản hồi** hoặc **KHÔNG chạy**

**Kết luận:** n8n service không chạy hoặc không listen port 5678.

---

## 🚀 Giải pháp nhanh - Chạy script debug

```bash
sudo bash /home/user/bez/debug-502-n8n.sh
```

Script sẽ kiểm tra:
1. Nginx có chạy không
2. Nginx config có lỗi không
3. n8n service có chạy không
4. Port 5678 có đang listen không
5. n8n process có tồn tại không
6. Backend có phản hồi không
7. Nginx error logs
8. n8n logs
9. Docker container (nếu dùng Docker)
10. Firewall settings

---

## 🛠️ Giải pháp thủ công

### Bước 1: Kiểm tra n8n có chạy không

```bash
sudo systemctl status n8n
```

**Kết quả mong đợi:**
```
● n8n.service - n8n workflow automation tool
   Loaded: loaded
   Active: active (running)
```

**Nếu thấy "inactive (dead)":**
```bash
# Start n8n
sudo systemctl start n8n

# Enable auto-start on boot
sudo systemctl enable n8n

# Kiểm tra lại
sudo systemctl status n8n
```

---

### Bước 2: Kiểm tra port 5678

```bash
sudo netstat -tlnp | grep 5678
```

**Kết quả mong đợi:**
```
tcp  0  0 127.0.0.1:5678  0.0.0.0:*  LISTEN  12345/node
```

**Nếu KHÔNG thấy gì:**
- n8n chưa start
- n8n bind sai port
- n8n crash khi start

---

### Bước 3: Xem n8n logs

```bash
# Nếu dùng systemd
sudo journalctl -u n8n -n 50

# Real-time logs
sudo journalctl -u n8n -f
```

**Tìm lỗi thường gặp:**
- `EADDRINUSE`: Port 5678 đã bị dùng
- `Error: Cannot find module`: Thiếu dependencies
- `SQLITE_ERROR`: Database bị lỗi
- `Permission denied`: Không có quyền ghi file

---

### Bước 4: Test backend trực tiếp

```bash
# Test n8n backend
curl -I http://localhost:5678/
```

**Kết quả mong đợi:**
```
HTTP/1.1 200 OK
```

**Nếu lỗi "Connection refused":**
- n8n không chạy
- n8n không listen đúng port

---

### Bước 5: Restart n8n và Nginx

```bash
# Restart n8n
sudo systemctl restart n8n

# Đợi 5 giây
sleep 5

# Kiểm tra n8n đã chạy
sudo systemctl status n8n

# Restart Nginx
sudo systemctl restart nginx

# Test lại
curl -I https://n8n.bez.vn/
```

---

## 🔧 Các tình huống cụ thể

### Tình huống 1: n8n service không tồn tại

```bash
# Kiểm tra
systemctl list-units --type=service | grep n8n
```

**Nếu KHÔNG có n8n.service:**

n8n có thể được chạy bằng:
- Docker
- PM2
- npm (trực tiếp)

**Kiểm tra Docker:**
```bash
docker ps | grep n8n
```

**Nếu có Docker container:**
```bash
# Check logs
docker logs n8n

# Restart container
docker restart n8n

# Hoặc start nếu stopped
docker start n8n
```

**Kiểm tra PM2:**
```bash
pm2 list | grep n8n
```

**Nếu có PM2:**
```bash
# Restart
pm2 restart n8n

# Logs
pm2 logs n8n
```

---

### Tình huống 2: Port 5678 bị process khác chiếm

```bash
# Tìm process đang dùng port 5678
sudo lsof -i :5678
```

**Nếu thấy process khác (không phải n8n):**
```bash
# Kill process đó (thay PID)
sudo kill -9 <PID>

# Start n8n lại
sudo systemctl start n8n
```

---

### Tình huống 3: n8n crash ngay sau khi start

```bash
# Xem logs chi tiết
sudo journalctl -u n8n -n 100 --no-pager

# Hoặc
sudo journalctl -u n8n -f
```

**Lỗi thường gặp và cách fix:**

#### Lỗi: Database locked

```
SQLITE_BUSY: database is locked
```

**Fix:**
```bash
# Stop n8n
sudo systemctl stop n8n

# Tìm file database
find / -name "database.sqlite" 2>/dev/null

# Xóa file lock (nếu có)
rm /path/to/.n8n/database.sqlite-wal
rm /path/to/.n8n/database.sqlite-shm

# Start lại
sudo systemctl start n8n
```

#### Lỗi: Permission denied

```
Error: EACCES: permission denied
```

**Fix:**
```bash
# Kiểm tra user đang chạy n8n
ps aux | grep n8n

# Sửa quyền cho thư mục .n8n
sudo chown -R <user>:<user> /home/<user>/.n8n/

# Hoặc nếu dùng root:
sudo chown -R root:root /root/.n8n/
```

#### Lỗi: Module not found

```
Error: Cannot find module 'xyz'
```

**Fix:**
```bash
# Cài lại n8n
npm install n8n -g

# Hoặc update
npm update n8n -g
```

---

### Tình huống 4: n8n chạy nhưng không listen 0.0.0.0

n8n có thể bind chỉ localhost hoặc IP cụ thể.

**Kiểm tra:**
```bash
netstat -tlnp | grep 5678
```

**Nếu thấy:**
```
tcp  0  0 192.168.1.100:5678  ...
```

Thì Nginx không thể connect qua `localhost:5678`.

**Fix:**

Cấu hình n8n bind `0.0.0.0` hoặc `127.0.0.1`:

```bash
# Tìm file cấu hình n8n
# Thường là /etc/systemd/system/n8n.service

sudo nano /etc/systemd/system/n8n.service
```

**Thêm environment variable:**
```ini
[Service]
Environment="N8N_HOST=0.0.0.0"
Environment="N8N_PORT=5678"
```

**Reload và restart:**
```bash
sudo systemctl daemon-reload
sudo systemctl restart n8n
```

---

## 📋 Checklist troubleshooting

Chạy từng lệnh và check:

```bash
# 1. n8n service active?
sudo systemctl status n8n
# Expected: active (running)

# 2. Port 5678 listening?
sudo netstat -tlnp | grep 5678
# Expected: có dòng với :5678

# 3. n8n process running?
ps aux | grep n8n
# Expected: có process n8n

# 4. Backend responds?
curl -I http://localhost:5678/
# Expected: HTTP/1.1 200 OK

# 5. Nginx config OK?
sudo nginx -t
# Expected: syntax is ok

# 6. Nginx running?
sudo systemctl status nginx
# Expected: active (running)

# 7. Test HTTPS
curl -I https://n8n.bez.vn/
# Expected: HTTP/2 200 (không phải 502)
```

---

## 🔍 Debug logs real-time

Mở 2 terminals:

**Terminal 1 - n8n logs:**
```bash
sudo journalctl -u n8n -f
```

**Terminal 2 - Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Sau đó mở browser và reload https://n8n.bez.vn/**

Xem logs xuất hiện gì.

---

## 🆘 Nếu vẫn không fix được

### Thu thập thông tin debug:

```bash
# Tạo file debug report
cat > /tmp/n8n-debug.txt <<EOF
=== NGINX STATUS ===
$(sudo systemctl status nginx)

=== N8N STATUS ===
$(sudo systemctl status n8n)

=== PORT 5678 ===
$(sudo netstat -tlnp | grep 5678)

=== N8N PROCESS ===
$(ps aux | grep n8n)

=== NGINX ERROR LOG ===
$(sudo tail -50 /var/log/nginx/error.log)

=== N8N LOG ===
$(sudo journalctl -u n8n -n 50)

=== NGINX CONFIG ===
$(sudo cat /etc/nginx/sites-available/n8n.bez.vn)

=== CURL TEST ===
$(curl -I http://localhost:5678/ 2>&1)
EOF

# Xem file
cat /tmp/n8n-debug.txt
```

---

## ✅ Giải pháp thông dụng nhất

Trong 90% trường hợp, lỗi 502 fix được bằng:

```bash
# Restart n8n
sudo systemctl restart n8n

# Đợi 5 giây cho n8n khởi động
sleep 5

# Kiểm tra n8n đã chạy
sudo systemctl status n8n

# Kiểm tra port
sudo netstat -tlnp | grep 5678

# Test backend
curl http://localhost:5678/

# Nếu backend OK, restart Nginx
sudo systemctl restart nginx

# Test HTTPS
curl https://n8n.bez.vn/
```

---

## 🎯 Lệnh nhanh - Copy paste

```bash
# One-liner fix thử nghiệm
sudo systemctl restart n8n && sleep 5 && sudo systemctl restart nginx && curl -I https://n8n.bez.vn/
```

Nếu thấy `HTTP/2 200` hoặc `HTTP/2 302` → **Thành công!** ✅

Nếu vẫn `502` → Chạy script debug:
```bash
sudo bash /home/user/bez/debug-502-n8n.sh
```

---

## 📚 Tài liệu tham khảo

- [n8n Deployment Guide](https://docs.n8n.io/hosting/)
- [Nginx Proxy 502 Errors](https://www.nginx.com/blog/502-bad-gateway-error-in-nginx/)
- [Systemd Service Debugging](https://www.freedesktop.org/software/systemd/man/systemctl.html)

---

**Chúc bạn fix thành công! 🚀**

Nếu cần hỗ trợ thêm, gửi output của:
```bash
sudo bash /home/user/bez/debug-502-n8n.sh > debug-output.txt 2>&1
cat debug-output.txt
```
