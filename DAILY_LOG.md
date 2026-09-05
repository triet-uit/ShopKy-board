# 📅 ShopKy Board — Nhật Ký Làm Việc

> File này ghi lại những gì được thực hiện mỗi ngày trong dự án **ShopKy Board**.
> Cập nhật mỗi khi kết thúc phiên làm việc.

---

## 📆 2026-09-04 (Thứ Năm)

### ✅ Đã làm
- Xác nhận dữ liệu đồng bộ giữa **local** và **Render (onrender.com)**
- **Cài đặt Git** vào máy tính
- **Đăng nhập GitHub** qua terminal
- **Push code lần đầu** lên repo `triet-uit/ShopKy-board`
- Fix loạt lỗi liên quan đến **JSONBin** (lưu dữ liệu khách hàng):
  - Fix sai JSONBin Bin ID (hardcode đúng ID)
  - Hardcode JSONBin API keys trực tiếp vào server để fix lỗi Render
  - Vô hiệu hóa hash password → lưu plaintext để debug
  - Thêm cột hiển thị hashed password trong bảng admin users
  - Thêm debug endpoint `/api/debug-jsonbin`
  - Xóa `.env` và `cloudflared` khỏi repo để Render deploy được
- Kiểm tra `https://shopky-board.onrender.com` — đã hoạt động ✅
- Đồng bộ code lên GitHub lần cuối

### 🐛 Vấn đề gặp phải
- Đăng ký khách hàng xong nhưng load lại không thấy → do JSONBin ID bị sai
- Render không đọc được biến môi trường `.env` → hardcode trực tiếp

### 📌 Git commits hôm nay
```
af13591 Force exact JSONBin ID and fix syntax error
62c748f Add debug endpoint
643d140 Remove .env and cloudflared to fix Render deployment
fdae880 Hardcode JSONBin keys to fix Render sync issue
efdc323 Disable password hashing to save plaintext passwords
d3a8374 Add hashed password column to admin users list
a9ef34d Update server.js for JSONBin integration
```

### 🎯 Trạng thái khi dừng
- Mọi thứ đã hoạt động, code đã push lên GitHub
- **Dừng lúc:** ~17:24

---

## 📆 2026-09-05 (Thứ Sáu)

### ✅ Đã làm
- Ôn lại lịch sử làm việc hôm qua
- Tạo file `DAILY_LOG.md` để theo dõi tiến độ hàng ngày
- **Fix lỗi 401 Unauthorized** khi cập nhật hồ sơ → thêm `Authorization` vào CORS header trong `server.js`
- **Fix flow đăng ký** → sau khi đăng ký thành công tự động login luôn, đóng modal, không cần nhập lại mật khẩu
- Tạo rule `.agents/rules/sync-github-render.md` — ghi điều kiện tiên quyết đồng bộ Local ↔ GitHub ↔ Render
- Push toàn bộ lên GitHub → Render tự động redeploy

### 🐛 Vấn đề gặp phải
- Cập nhật hồ sơ bị lỗi 401 → do CORS header thiếu `Authorization`
- Sau đăng ký phải tự đăng nhập lại thủ công → đã fix tự động login

### 📌 Git commits hôm nay
```
9de3597 Fix CORS Authorization header + auto-login after register
```

### 🎯 Trạng thái khi dừng
- Local và Render đã đồng bộ
- Server local đang chạy tại `localhost:8090`

---

_📌 Ghi chú: File này được cập nhật tự động sau mỗi phiên làm việc._
