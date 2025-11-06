# 🚀 Quick SSL Setup - 5 phút

Hướng dẫn nhanh cài đặt SSL cho Bez project.

---

## ⚡ Setup nhanh với Script tự động

```bash
# 1. Chạy script setup SSL
sudo bash setup-ssl.sh

# 2. Nhập thông tin khi được hỏi:
#    - Domain: your-domain.com
#    - Email: your-email@example.com

# 3. Đợi 2-3 phút để script hoàn thành

# 4. Done! ✅
```

---

## 📝 Cấu hình Nginx cho Bez Project

### Option 1: Sử dụng config có sẵn

```bash
# Copy config mẫu
sudo cp nginx-ssl-config-example.conf /etc/nginx/sites-available/your-domain.com

# Sửa domain trong file
sudo nano /etc/nginx/sites-available/your-domain.com
# Thay "your-domain.com" bằng domain thật

# Enable site
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/

# Test và reload
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: Tạo config mới

```bash
# Tạo file config
sudo nano /etc/nginx/sites-available/your-domain.com
```

Dán nội dung sau (chỉnh sửa `your-domain.com` và port nếu cần):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (Certbot sẽ tự động thêm các dòng này)
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable và reload
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 Lấy SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Trả lời các câu hỏi:
1. Email: `your-email@example.com`
2. Terms: `Y`
3. Redirect HTTP to HTTPS: `2` (Yes)

---

## 🎯 Setup Bez Application để chạy tự động

### 1. Tạo systemd service

```bash
# Copy service file
sudo cp bez.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service (auto-start on boot)
sudo systemctl enable bez

# Start service
sudo systemctl start bez

# Check status
sudo systemctl status bez
```

### 2. Các lệnh quản lý service

```bash
# Start
sudo systemctl start bez

# Stop
sudo systemctl stop bez

# Restart
sudo systemctl restart bez

# View logs
sudo journalctl -u bez -f

# View last 100 lines
sudo journalctl -u bez -n 100
```

---

## ✅ Kiểm tra SSL

### Quick test

```bash
# Test HTTPS
curl -I https://your-domain.com

# Kiểm tra certificate
bash check-ssl-health.sh your-domain.com
```

### Kiểm tra chi tiết

Truy cập: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

Mục tiêu: **A hoặc A+** rating

---

## 🔄 Auto-renewal

Certificate tự động renew. Kiểm tra:

```bash
# Xem timer status
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run

# Force renew (nếu cần)
sudo certbot renew --force-renewal
```

---

## 🛠️ Troubleshooting nhanh

### Lỗi: "Connection refused"

```bash
# Kiểm tra Nginx running
sudo systemctl status nginx

# Kiểm tra Bez app running
sudo systemctl status bez

# Xem logs
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u bez -f
```

### Lỗi: "Certificate not found"

```bash
# Xem certificates
sudo certbot certificates

# Renew nếu hết hạn
sudo certbot renew
```

### Lỗi: Port đã bị dùng

```bash
# Xem process đang dùng port 3000
sudo lsof -i :3000

# Kill process (thay PID)
sudo kill -9 <PID>

# Restart Bez service
sudo systemctl restart bez
```

---

## 📊 Monitoring

### Check logs real-time

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Bez application logs
sudo journalctl -u bez -f

# Certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Check SSL certificate expiry

```bash
# Method 1
sudo certbot certificates

# Method 2
bash check-ssl-health.sh your-domain.com

# Method 3
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🎉 Hoàn tất!

Website của bạn đã có SSL và chạy tự động.

**URLs:**
- HTTP: http://your-domain.com → Auto redirect
- HTTPS: https://your-domain.com ✅

**Services:**
- Nginx: Running và enabled
- Bez App: Running và enabled
- Certbot Timer: Active (auto-renew mỗi 12h)

---

## 📚 Chi tiết thêm

Xem file `SSL-SETUP-GUIDE.md` để có hướng dẫn chi tiết đầy đủ.
