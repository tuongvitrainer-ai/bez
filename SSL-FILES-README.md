# 📦 SSL Setup Files - Tổng quan

Thư mục này chứa tất cả các file cần thiết để cài đặt SSL miễn phí (Let's Encrypt) cho Bez project.

---

## 📁 Danh sách Files

### 🚀 Scripts

1. **`setup-ssl.sh`** - Script tự động cài đặt SSL
   - Cài đặt Nginx, Certbot
   - Tạo config Nginx
   - Lấy SSL certificate
   - Cấu hình auto-renewal
   - **Sử dụng:** `sudo bash setup-ssl.sh`

2. **`check-ssl-health.sh`** - Script kiểm tra SSL health
   - Kiểm tra DNS, ports, certificate
   - Xem ngày hết hạn
   - Kiểm tra HSTS, redirect
   - **Sử dụng:** `bash check-ssl-health.sh your-domain.com`

### 📄 Configuration Files

3. **`nginx-ssl-config-example.conf`** - Nginx config mẫu với SSL
   - HTTP/2 support
   - Security headers
   - Proxy settings cho Node.js
   - Gzip compression
   - WebSocket support

4. **`bez.service`** - Systemd service cho Bez app
   - Auto-start khi boot
   - Auto-restart khi crash
   - Log management
   - **Cài đặt:** `sudo cp bez.service /etc/systemd/system/`

### 📚 Documentation

5. **`SSL-SETUP-GUIDE.md`** - Hướng dẫn chi tiết đầy đủ
   - Cài đặt thủ công từng bước
   - Troubleshooting
   - Best practices
   - FAQ

6. **`QUICK-SSL-SETUP.md`** - Hướng dẫn nhanh 5 phút
   - Quick start với script
   - Các lệnh thường dùng
   - Troubleshooting cơ bản

7. **`SSL-FILES-README.md`** - File này (tổng quan)

---

## 🎯 Quick Start - 3 Bước

### Bước 1: Setup SSL

```bash
sudo bash setup-ssl.sh
```

Nhập:
- Domain: `your-domain.com`
- Email: `your-email@example.com`

### Bước 2: Setup Bez Service

```bash
sudo cp bez.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable bez
sudo systemctl start bez
```

### Bước 3: Kiểm tra

```bash
# Check SSL
bash check-ssl-health.sh your-domain.com

# Check Bez app
sudo systemctl status bez

# Check Nginx
sudo systemctl status nginx
```

---

## 📋 Workflow đầy đủ

```
1. Chuẩn bị
   ├─ Domain đã trỏ về IP server (A record)
   ├─ Port 80, 443 mở
   └─ Server Ubuntu 24.04

2. Cài đặt SSL
   ├─ Chạy: sudo bash setup-ssl.sh
   ├─ Nhập domain và email
   └─ Đợi script hoàn thành (2-3 phút)

3. Cấu hình Nginx (Optional - nếu muốn custom)
   ├─ Copy: sudo cp nginx-ssl-config-example.conf /etc/nginx/sites-available/your-domain.com
   ├─ Edit: sudo nano /etc/nginx/sites-available/your-domain.com
   ├─ Test: sudo nginx -t
   └─ Reload: sudo systemctl reload nginx

4. Setup Bez App
   ├─ Copy: sudo cp bez.service /etc/systemd/system/
   ├─ Reload: sudo systemctl daemon-reload
   ├─ Enable: sudo systemctl enable bez
   └─ Start: sudo systemctl start bez

5. Kiểm tra
   ├─ SSL: bash check-ssl-health.sh your-domain.com
   ├─ App: sudo systemctl status bez
   └─ Web: https://your-domain.com

6. Monitor
   ├─ Nginx logs: sudo tail -f /var/log/nginx/access.log
   ├─ Bez logs: sudo journalctl -u bez -f
   └─ SSL renewal: sudo systemctl status certbot.timer
```

---

## 🔧 Các lệnh hữu ích

### SSL Management

```bash
# Xem certificates
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# Health check
bash check-ssl-health.sh your-domain.com
```

### Nginx Management

```bash
# Test config
sudo nginx -t

# Reload config
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/error.log
```

### Bez App Management

```bash
# Start
sudo systemctl start bez

# Stop
sudo systemctl stop bez

# Restart
sudo systemctl restart bez

# Status
sudo systemctl status bez

# Logs
sudo journalctl -u bez -f

# Last 100 lines
sudo journalctl -u bez -n 100
```

---

## 📊 File Structure

```
bez/
├── setup-ssl.sh                      # Auto setup script
├── check-ssl-health.sh               # Health check script
├── nginx-ssl-config-example.conf     # Nginx config template
├── bez.service                       # Systemd service file
├── SSL-SETUP-GUIDE.md                # Full guide
├── QUICK-SSL-SETUP.md                # Quick guide
└── SSL-FILES-README.md               # This file
```

---

## 🎓 Học thêm

### Cho người mới bắt đầu

Đọc: **`QUICK-SSL-SETUP.md`**
- Hướng dẫn step-by-step đơn giản
- Các lệnh copy/paste sẵn

### Cho người có kinh nghiệm

Đọc: **`SSL-SETUP-GUIDE.md`**
- Giải thích chi tiết từng bước
- Troubleshooting nâng cao
- Best practices
- Security hardening

---

## ⚙️ Yêu cầu hệ thống

- ✅ Ubuntu 24.04 LTS (hoặc Debian-based)
- ✅ Node.js đã cài đặt
- ✅ Quyền sudo/root
- ✅ Domain đã trỏ về server
- ✅ Port 80, 443 mở

---

## 🔐 Security Notes

### Scripts an toàn

Tất cả scripts đã được kiểm tra:
- ✅ Không chứa hardcoded credentials
- ✅ Validate input từ user
- ✅ Sử dụng HTTPS cho tất cả connections
- ✅ Follow best practices

### Permissions

```bash
# Scripts executable
-rwxr-xr-x  setup-ssl.sh
-rwxr-xr-x  check-ssl-health.sh

# Configs read-only
-rw-r--r--  nginx-ssl-config-example.conf
-rw-r--r--  bez.service
```

---

## 🆘 Troubleshooting

### Script không chạy

```bash
# Set executable permission
chmod +x setup-ssl.sh check-ssl-health.sh

# Chạy với sudo
sudo bash setup-ssl.sh
```

### Lỗi "Command not found"

```bash
# Cài đặt dependencies
sudo apt update
sudo apt install -y curl openssl dnsutils
```

### Certificate không auto-renew

```bash
# Check timer
sudo systemctl status certbot.timer

# Enable timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

## 📞 Support

### Kiểm tra logs

```bash
# Certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Bez app logs
sudo journalctl -u bez -f

# System logs
sudo journalctl -xe
```

### Debug mode

```bash
# Nginx debug
sudo nginx -t -c /etc/nginx/nginx.conf

# Certbot verbose
sudo certbot certificates --verbose

# Service status
sudo systemctl status bez nginx certbot.timer
```

---

## 🎉 Hoàn tất!

Sau khi setup xong:
- ✅ SSL certificate đã cài đặt
- ✅ Auto-renewal đã enable
- ✅ Nginx đã cấu hình HTTPS
- ✅ Bez app chạy tự động
- ✅ Redirect HTTP → HTTPS

**Website:** https://your-domain.com ✨

---

## 📝 Checklist

Sau khi cài đặt, kiểm tra:

- [ ] HTTPS hoạt động: `curl -I https://your-domain.com`
- [ ] HTTP redirect: `curl -I http://your-domain.com`
- [ ] SSL certificate valid: `bash check-ssl-health.sh your-domain.com`
- [ ] Bez app running: `sudo systemctl status bez`
- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] Auto-renewal enabled: `sudo systemctl status certbot.timer`
- [ ] SSL rating A+: https://www.ssllabs.com/ssltest/

---

## 🚀 Next Steps

Sau khi SSL hoạt động:

1. **Performance optimization**
   - Enable Gzip compression
   - Configure caching
   - Enable HTTP/2
   - CDN setup (Cloudflare, etc.)

2. **Security hardening**
   - Setup fail2ban
   - Configure firewall (UFW)
   - Enable security headers
   - Regular updates

3. **Monitoring**
   - Setup uptime monitoring
   - Configure log rotation
   - SSL expiry alerts
   - Application monitoring

4. **Backup**
   - Backup `/etc/letsencrypt/`
   - Backup Nginx configs
   - Database backup (if any)
   - Code backup

---

**Happy secure browsing! 🔒✨**
