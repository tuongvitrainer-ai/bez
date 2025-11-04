# Hướng Dẫn Cài Đặt và Chạy Server

## 1. Yêu Cầu Hệ Thống

- **Node.js**: phiên bản 14.x hoặc cao hơn (bạn đang dùng v24.11.0 - OK ✓)
- **npm**: đi kèm với Node.js

## 2. Cài Đặt Dependencies

Trước khi chạy server, bạn **BẮT BUỘC** phải cài đặt các thư viện phụ thuộc:

```bash
npm install
```

Lệnh này sẽ cài đặt tất cả các thư viện trong `package.json`:
- `axios` - Gọi API HTTP
- `express` - Web framework
- `ejs` - Template engine
- `dotenv` - Quản lý biến môi trường
- `express-session` - Quản lý session
- `nodemon` - Auto-reload khi phát triển (dev dependency)

## 3. Cấu Hình Môi Trường

Tạo file `.env` trong thư mục gốc dự án:

```bash
cp .env.example .env
```

Hoặc tạo file `.env` với nội dung:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret (thay đổi giá trị này trong production)
SESSION_SECRET=your-super-secret-key-here-change-this

# YouTube API (nếu cần)
YOUTUBE_API_KEY=your-youtube-api-key-here
```

## 4. Cách Chạy Server

### Chế độ Production (bình thường):
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

### Chế độ Development (tự động reload khi có thay đổi):
```bash
npm run dev
```

## 5. Giải Thích Lỗi Bạn Gặp Phải

```
Error: Cannot find module 'axios'
```

**Nguyên nhân**: Bạn chưa chạy lệnh `npm install` để cài đặt các dependencies.

**Giải pháp**: Chạy `npm install` trước khi `npm start`

## 6. Các Lệnh Hữu Ích

```bash
# Cài đặt dependencies
npm install

# Chạy server (production)
npm start

# Chạy server (development - auto reload)
npm run dev

# Xem danh sách dependencies đã cài
npm list --depth=0

# Cài lại toàn bộ dependencies (nếu gặp lỗi)
rm -rf node_modules package-lock.json
npm install
```

## 7. Kiểm Tra Server Đã Chạy

Sau khi chạy thành công, bạn sẽ thấy:

```
Server is running on http://localhost:3000
Environment: development
```

Mở trình duyệt và truy cập: `http://localhost:3000`

## 8. Cấu Trúc Dự Án

```
bez/
├── app.js                 # File chính của server
├── package.json           # Thông tin dự án và dependencies
├── .env                   # Biến môi trường (tạo từ .env.example)
├── routes/               # Các route handlers
│   ├── index.js
│   ├── auth.js
│   ├── dashboard.js
│   └── youtube-research.js
├── views/                # EJS templates
├── public/               # Static files (CSS, JS, images)
└── node_modules/         # Dependencies (tự động tạo sau npm install)
```

## 9. Troubleshooting

### Lỗi: Port đã được sử dụng
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Giải pháp**: Thay đổi PORT trong file `.env` hoặc tắt process đang dùng port 3000

### Lỗi: Permission denied
```bash
sudo npm install  # Không khuyến khích
# HOẶC
npm install --unsafe-perm
```

### Xóa cache npm nếu gặp lỗi lạ
```bash
npm cache clean --force
npm install
```

---

## Tóm Tắt Các Bước

1. ✅ Kiểm tra Node.js đã cài: `node -v`
2. ✅ Cài đặt dependencies: `npm install`
3. ✅ Tạo file `.env` (nếu chưa có)
4. ✅ Chạy server: `npm start` hoặc `npm run dev`
5. ✅ Mở trình duyệt: `http://localhost:3000`

**Lưu ý**: Đây là dự án **Node.js/Express**, KHÔNG cần cài Python, Flask hay bất kỳ công cụ Python nào!
