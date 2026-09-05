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
- Tạo file `DAILY_LOG.md` + rule `sync-github-render.md` (đồng bộ cả trang khách hàng lẫn admin)
- **Fix lỗi 401** khi cập nhật hồ sơ → thêm `Authorization` vào CORS header
- **Fix flow đăng ký** → tự động đăng nhập sau khi đăng ký, đóng modal luôn
- **Di chuyển toast notification** từ góc dưới trái → **trên cùng chính giữa** (pill style, glassmorphism, slide từ trên xuống) — áp dụng cả 2 trang
- **Fix lỗi mất session sau redeploy** → thay `SESSIONS = {}` (RAM) bằng **JWT stateless** (HMAC-SHA256, tự implement bằng `crypto` built-in, không cần thư viện ngoài)
  - Token có hiệu lực **30 ngày**
  - Server restart / Render redeploy → **không bị đăng xuất** nữa

### 🐛 Vấn đề gặp phải
- 401 khi cập nhật hồ sơ → CORS thiếu `Authorization` header
- Sau đăng ký phải tự đăng nhập lại → đã fix auto-login
- F5 hoặc Render redeploy → mất session vì RAM → đã fix bằng JWT

### 📌 Git commits hôm nay
```
e7de7fd fix: remove leftover SESSIONS reference in profile update route
f2ecfee fix: add JSONBin timeout+logging + debug endpoint
f22e573 fix: replace RAM sessions with stateless JWT
738f108 feat: move toast notifications to top-center of page
3ce4929 docs: clarify sync rule includes both customer and admin pages
9de3597 fix: CORS Authorization header + auto-login after register
```

### 🎯 Trạng thái khi dừng
- ✅ Local và Render đồng bộ, cùng chạy code mới nhất
- ✅ JWT hoạt động — không bị đăng xuất sau mỗi deploy
- ✅ Cập nhật hồ sơ hoạt động trên cả local lẫn Render
- ✅ Toast notification hiển thị top-center cả 2 trang
- ✅ Đăng ký tự động đăng nhập luôn

---

_📌 Ghi chú: File này được cập nhật tự động sau mỗi phiên làm việc._
