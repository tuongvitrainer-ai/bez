# 🔧 Fix Nginx HTTPS cho n8n.bez.vn

## ⚠️ Vấn đề

Sau khi cài SSL, trang https://n8n.bez.vn/ chỉ hiển thị trang welcome mặc định của Nginx, không proxy đến ứng dụng n8n.

**Nguyên nhân:** Block HTTPS (port 443) không có `proxy_pass` để forward request đến backend n8n.

---

## 🚀 Giải pháp nhanh - Chạy script tự động

```bash
# Chạy script fix
sudo bash fix-nginx-n8n.sh
```

Script sẽ:
1. Backup config cũ
2. Tạo config mới với proxy_pass đầy đủ
3. Test và reload Nginx
4. Báo cáo kết quả

---

## 🛠️ Giải pháp thủ công

### Bước 1: Kiểm tra file config hiện tại

```bash
# Xem config hiện tại
sudo cat /etc/nginx/sites-available/n8n.bez.vn

# Hoặc
sudo cat /etc/nginx/sites-enabled/n8n.bez.vn
```

### Bước 2: Tìm vấn đề

Kiểm tra block HTTPS (port 443):

```nginx
server {
    listen 443 ssl http2;
    server_name n8n.bez.vn;

    # SSL certificates...
    ssl_certificate /etc/letsencrypt/live/n8n.bez.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.bez.vn/privkey.pem;

    # ❌ THIẾU phần này:
    # location / {
    #     proxy_pass http://localhost:5678;
    #     ...
    # }
}
```

**Vấn đề:** Block HTTPS không có `location /` với `proxy_pass`.

### Bước 3: Backup config cũ

```bash
sudo cp /etc/nginx/sites-available/n8n.bez.vn /etc/nginx/sites-available/n8n.bez.vn.backup
```

### Bước 4: Sửa file config

```bash
sudo nano /etc/nginx/sites-available/n8n.bez.vn
```

**Config đúng phải như thế này:**

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name n8n.bez.vn;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Main Config
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name n8n.bez.vn;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/n8n.bez.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.bez.vn/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Logging
    access_log /var/log/nginx/n8n.bez.vn.access.log;
    error_log /var/log/nginx/n8n.bez.vn.error.log;

    # File upload size
    client_max_body_size 100M;

    # ✅ QUAN TRỌNG: Proxy to n8n
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;

        # WebSocket support (n8n cần)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        proxy_cache_bypass $http_upgrade;

        # Timeouts (n8n workflows có thể chạy lâu)
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        # Buffer settings
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

### Bước 5: Test config

```bash
sudo nginx -t
```

Kết quả mong đợi:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Bước 6: Reload Nginx

```bash
sudo systemctl reload nginx
```

### Bước 7: Kiểm tra

```bash
# Kiểm tra Nginx running
sudo systemctl status nginx

# Kiểm tra n8n running
sudo systemctl status n8n

# Kiểm tra port 5678
sudo netstat -tlnp | grep 5678

# Test URL
curl -I https://n8n.bez.vn/
```

---

## 🔍 Troubleshooting

### Lỗi 1: "502 Bad Gateway"

**Nguyên nhân:** n8n không chạy hoặc không listen port 5678

**Giải pháp:**

```bash
# Kiểm tra n8n status
sudo systemctl status n8n

# Start n8n nếu không chạy
sudo systemctl start n8n

# Kiểm tra port
sudo netstat -tlnp | grep 5678

# Xem n8n logs
sudo journalctl -u n8n -f
```

### Lỗi 2: Vẫn thấy trang welcome

**Nguyên nhân:** Nginx vẫn dùng config cũ hoặc cache browser

**Giải pháp:**

```bash
# Hard reload Nginx
sudo systemctl restart nginx

# Clear browser cache
# Hoặc test với curl:
curl -I https://n8n.bez.vn/

# Test với incognito mode
```

### Lỗi 3: "Connection timeout"

**Nguyên nhân:** Firewall block port 5678 hoặc n8n không bind đúng interface

**Giải pháp:**

```bash
# Kiểm tra n8n đang listen interface nào
sudo netstat -tlnp | grep 5678

# Kết quả đúng:
# tcp  0  0 127.0.0.1:5678  0.0.0.0:*  LISTEN  12345/node

# Nếu n8n bind 0.0.0.0:5678 thì OK
# Nếu bind 127.0.0.1:5678 thì OK (localhost only)
```

### Lỗi 4: WebSocket không hoạt động

**Nguyên nhân:** Thiếu WebSocket headers

**Giải pháp:** Đảm bảo có các dòng này trong config:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_cache_bypass $http_upgrade;
```

---

## 🔍 Debug Commands

### Xem logs real-time

```bash
# Nginx error log
sudo tail -f /var/log/nginx/error.log

# n8n log
sudo journalctl -u n8n -f

# n8n-specific Nginx log
sudo tail -f /var/log/nginx/n8n.bez.vn.error.log
```

### Kiểm tra connection

```bash
# Test từ server
curl -I http://localhost:5678/

# Test qua Nginx local
curl -I http://localhost/ -H "Host: n8n.bez.vn"

# Test HTTPS
curl -I https://n8n.bez.vn/
```

### Kiểm tra processes

```bash
# Processes đang chạy
ps aux | grep n8n
ps aux | grep nginx

# Ports đang listen
sudo netstat -tlnp | grep -E "5678|80|443"
```

---

## ✅ Checklist

Sau khi fix, kiểm tra:

- [ ] Nginx config có `proxy_pass` trong block HTTPS
- [ ] Nginx syntax test pass: `sudo nginx -t`
- [ ] Nginx đã reload: `sudo systemctl reload nginx`
- [ ] n8n đang chạy: `sudo systemctl status n8n`
- [ ] Port 5678 đang listen: `sudo netstat -tlnp | grep 5678`
- [ ] HTTPS hoạt động: `curl -I https://n8n.bez.vn/`
- [ ] Không còn thấy trang welcome
- [ ] Có thể login vào n8n
- [ ] WebSocket hoạt động (workflows chạy được)

---

## 📝 Giải thích vấn đề

### Tại sao lại xảy ra?

Khi chạy Certbot với option `--nginx`, Certbot sẽ:

1. ✅ Đọc config hiện tại (có proxy_pass)
2. ✅ Lấy SSL certificate
3. ⚠️ Tạo block HTTPS mới
4. ❌ Đôi khi **KHÔNG copy** proxy settings vào block HTTPS

Kết quả:
- Block HTTP (port 80): Có proxy_pass ✅
- Block HTTPS (port 443): **KHÔNG có** proxy_pass ❌

Khi truy cập HTTPS, Nginx không biết forward đâu → trả về trang welcome mặc định.

### Solution

Thêm `proxy_pass` vào block HTTPS (port 443) để forward request đến n8n backend (localhost:5678).

---

## 🎯 Config template cho các app khác

Nếu bạn có app khác (không phải n8n), sửa lại:

```nginx
location / {
    proxy_pass http://localhost:YOUR_PORT;  # ← Đổi port
    proxy_http_version 1.1;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_cache_bypass $http_upgrade;
}
```

Thay `YOUR_PORT` bằng:
- n8n: `5678`
- Bez app: `3000`
- Another Node.js app: `3001`, `3002`, etc.

---

## 📚 Tham khảo

- [Nginx Proxy Pass](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)
- [WebSocket Proxying](https://nginx.org/en/docs/http/websocket.html)
- [n8n Deployment Guide](https://docs.n8n.io/hosting/)

---

**Chúc bạn fix thành công! 🚀**
