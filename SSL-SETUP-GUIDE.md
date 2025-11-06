# 🔒 Hướng dẫn cài đặt SSL miễn phí Let's Encrypt cho Nginx

Hướng dẫn chi tiết cài đặt SSL/TLS miễn phí từ Let's Encrypt sử dụng Certbot trên Ubuntu 24.04 với Nginx.

---

## 📋 Yêu cầu trước khi bắt đầu

- ✅ VPS/Server chạy Ubuntu 24.04
- ✅ Tên miền đã trỏ về IP server (A record)
- ✅ Port 80 và 443 đã mở trên firewall
- ✅ Quyền sudo/root

---

## 🚀 Phương pháp 1: Sử dụng Script tự động (Khuyến nghị)

### Bước 1: Chạy script

```bash
sudo bash setup-ssl.sh
```

Script sẽ tự động:
1. Cập nhật hệ thống
2. Cài đặt Nginx (nếu chưa có)
3. Cài đặt Certbot và plugin Nginx
4. Tạo file cấu hình Nginx
5. Lấy SSL certificate
6. Cấu hình auto-renewal

### Bước 2: Nhập thông tin

- **Domain**: Tên miền của bạn (ví dụ: example.com)
- **Email**: Email để nhận thông báo từ Let's Encrypt

### Bước 3: Hoàn tất! 🎉

Script sẽ tự động cấu hình mọi thứ. Sau khi hoàn thành, truy cập:
- `https://your-domain.com`

---

## 🛠️ Phương pháp 2: Cài đặt thủ công (Chi tiết)

### 1️⃣ Cập nhật hệ thống

```bash
sudo apt update
sudo apt upgrade -y
```

### 2️⃣ Cài đặt Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### 3️⃣ Cấu hình Firewall (UFW)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

### 4️⃣ Tạo file cấu hình Nginx

Tạo file `/etc/nginx/sites-available/your-domain.com`:

```bash
sudo nano /etc/nginx/sites-available/your-domain.com
```

Thêm nội dung (thay `your-domain.com` bằng domain của bạn):

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name your-domain.com www.your-domain.com;

    root /var/www/your-domain.com;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Hoặc nếu bạn đang chạy ứng dụng Node.js (như Bez):**

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name your-domain.com www.your-domain.com;

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

### 5️⃣ Enable site và test config

```bash
# Tạo symbolic link
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/

# Xóa default config
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 6️⃣ Cài đặt Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 7️⃣ Lấy SSL Certificate

**Option 1: Tự động cấu hình Nginx (Khuyến nghị)**

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Option 2: Chỉ lấy certificate (không tự động cấu hình)**

```bash
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### 8️⃣ Nhập thông tin

Certbot sẽ hỏi:
1. **Email**: Nhập email của bạn
2. **Terms of Service**: Nhập `Y` để đồng ý
3. **Redirect HTTP to HTTPS**: Nhập `2` để redirect tự động

### 9️⃣ Xác minh SSL

Sau khi cài đặt, truy cập:
```
https://your-domain.com
```

Hoặc kiểm tra SSL rating tại:
```
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

---

## 🔄 Auto-Renewal (Tự động gia hạn)

Certbot tự động cài đặt systemd timer để gia hạn certificate.

### Kiểm tra timer

```bash
sudo systemctl status certbot.timer
```

### Test renewal (dry run)

```bash
sudo certbot renew --dry-run
```

### Renewal thủ công

```bash
sudo certbot renew
```

### Xem lịch chạy timer

```bash
systemctl list-timers | grep certbot
```

Certificate Let's Encrypt có hiệu lực **90 ngày**. Certbot sẽ tự động renew khi còn **30 ngày** trước khi hết hạn.

---

## 📁 Cấu trúc thư mục SSL

Sau khi cài đặt, certificate sẽ được lưu tại:

```
/etc/letsencrypt/
├── live/
│   └── your-domain.com/
│       ├── fullchain.pem      # Full certificate chain
│       ├── privkey.pem        # Private key
│       ├── cert.pem           # Certificate only
│       └── chain.pem          # Chain only
├── archive/                   # Archived certificates
├── renewal/                   # Renewal configs
└── options-ssl-nginx.conf     # SSL options
```

---

## 🔧 Cấu hình nâng cao cho Nginx + SSL

Tham khảo file `nginx-ssl-config-example.conf` để có cấu hình tối ưu với:

✅ HTTP/2 support
✅ Security headers (HSTS, X-Frame-Options, etc.)
✅ Gzip compression
✅ Proxy settings cho Node.js
✅ Static file caching
✅ WebSocket support

---

## 🛠️ Các lệnh hữu ích

### Xem thông tin certificate

```bash
sudo certbot certificates
```

### Xem logs

```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Revoke certificate

```bash
sudo certbot revoke --cert-path /etc/letsencrypt/live/your-domain.com/cert.pem
```

### Xóa certificate

```bash
sudo certbot delete --cert-name your-domain.com
```

### Test Nginx config

```bash
sudo nginx -t
```

### Reload Nginx

```bash
sudo systemctl reload nginx
```

### Restart Nginx

```bash
sudo systemctl restart nginx
```

### Xem Nginx logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔍 Troubleshooting

### Lỗi: Port 80/443 không thể access

```bash
# Kiểm tra firewall
sudo ufw status

# Mở port
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Lỗi: Domain không resolve

```bash
# Kiểm tra DNS
nslookup your-domain.com
dig your-domain.com

# Đảm bảo A record trỏ đúng IP server
```

### Lỗi: Nginx không start

```bash
# Kiểm tra syntax
sudo nginx -t

# Xem logs
sudo journalctl -u nginx -n 50
```

### Lỗi: Certificate không renew tự động

```bash
# Test renewal
sudo certbot renew --dry-run

# Kiểm tra timer
sudo systemctl status certbot.timer

# Enable timer nếu disabled
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Lỗi: "Too Many Requests" từ Let's Encrypt

Let's Encrypt có rate limits:
- **50 certificates** per domain per week
- **5 duplicate certificates** per week

Giải pháp: Đợi 7 ngày hoặc sử dụng `--dry-run` để test.

---

## 📊 Kiểm tra SSL Security

### 1. SSL Labs Test

```
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

Target: **A hoặc A+ rating**

### 2. Test với OpenSSL

```bash
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### 3. Test HTTP to HTTPS redirect

```bash
curl -I http://your-domain.com
```

Kết quả mong đợi: `301 Moved Permanently` hoặc `302 Found` với `Location: https://...`

---

## 🎯 Best Practices

1. **Luôn sử dụng HTTPS Redirect**: Chuyển hướng tất cả HTTP traffic sang HTTPS
2. **Enable HSTS**: Thêm header `Strict-Transport-Security`
3. **Sử dụng HTTP/2**: Cải thiện performance
4. **Cấu hình Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
5. **Monitor expiry dates**: Theo dõi ngày hết hạn certificate
6. **Backup certificates**: Backup thư mục `/etc/letsencrypt/`
7. **Test renewal thường xuyên**: Chạy `certbot renew --dry-run` định kỳ

---

## 📚 Tài liệu tham khảo

- [Certbot Documentation](https://certbot.eff.org/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

---

## ❓ Câu hỏi thường gặp

### Q: Certificate Let's Encrypt có miễn phí không?

**A:** Có, hoàn toàn miễn phí. Không có phí ẩn.

### Q: Certificate có hiệu lực bao lâu?

**A:** 90 ngày. Certbot sẽ tự động renew khi còn 30 ngày.

### Q: Có thể sử dụng cho subdomain?

**A:** Có. Thêm `-d subdomain.your-domain.com` khi chạy certbot.

### Q: Wildcard certificate có được hỗ trợ không?

**A:** Có, nhưng cần sử dụng DNS challenge:
```bash
sudo certbot certonly --manual --preferred-challenges dns -d *.your-domain.com
```

### Q: Có giới hạn số lượng domain không?

**A:** Mỗi certificate có thể chứa tối đa **100 domains**.

---

## 🚨 Lưu ý quan trọng

- ⚠️ **Không share private key** (`privkey.pem`)
- ⚠️ **Backup thư mục `/etc/letsencrypt/`** định kỳ
- ⚠️ **Test renewal trước** khi certificate hết hạn
- ⚠️ **Monitor logs** để phát hiện vấn đề sớm
- ⚠️ **Đảm bảo server có thời gian chính xác** (NTP sync)

---

**Chúc bạn cài đặt SSL thành công! 🎉🔒**

Nếu có vấn đề, kiểm tra logs:
- Certbot: `/var/log/letsencrypt/letsencrypt.log`
- Nginx: `/var/log/nginx/error.log`
