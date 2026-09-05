# Quy tắc: Đồng Bộ Local ↔ GitHub ↔ Render

## ⚠️ ĐIỀU KIỆN TIÊN QUYẾT — BẮT BUỘC THỰC HIỆN

Dự án này chạy song song trên **2 môi trường**, gồm **CẢ 2 TRANG** (khách hàng + quản trị):

| | Local | Render (Production) |
|---|---|---|
| 🛍️ **Trang khách hàng** | `http://localhost:8090/ShopKy` | `https://shopky-board.onrender.com/ShopKy` |
| 🔧 **Trang quản trị** | `http://localhost:8090/admin.html` | `https://shopky-board.onrender.com/admin.html` |

Cả 2 môi trường đều đồng bộ qua **GitHub repo**: `https://github.com/triet-uit/ShopKy-board`

> ⚠️ Mọi thay đổi dù ở trang khách hàng hay trang quản trị đều phải được push lên GitHub để Render đồng bộ theo.

---

## Quy tắc bắt buộc

### 1. Sau mỗi lần sửa code ở LOCAL → PHẢI push lên GitHub
```bash
git add <files>
git commit -m "mô tả ngắn gọn"
git push origin main
```
→ Render sẽ **tự động redeploy** sau khi nhận commit mới (~2-5 phút)

### 2. Không được bỏ qua bước push
- Dù chỉ sửa 1 dòng nhỏ, 1 fix bug nhỏ → vẫn phải push
- Không push = Render vẫn chạy code cũ = local ≠ onrender → BUG

### 3. Khi được yêu cầu fix/update bất cứ thứ gì
Luôn thực hiện đủ 3 bước:
1. ✅ Sửa code
2. ✅ Restart server local để test
3. ✅ Push GitHub → Render đồng bộ

### 4. Commit message rõ ràng
Format: `<loại>: <mô tả>`
- `fix:` — sửa lỗi
- `feat:` — thêm tính năng
- `update:` — cập nhật
- `refactor:` — tái cấu trúc

Ví dụ:
```
fix: CORS Authorization header + auto-login after register
feat: add daily log tracking
```

---

## Lưu ý về Render

- Render **stateless** — session RAM (`SESSIONS = {}`) bị reset sau mỗi deploy hoặc sau 15 phút idle
- Sau mỗi deploy mới, người dùng trên Render sẽ bị đăng xuất → cần đăng nhập lại
- Dữ liệu khách hàng/đơn hàng được lưu ở **JSONBin** (cloud) → không bị mất khi restart

---

## Checklist trước khi kết thúc phiên làm việc

- [ ] Tất cả thay đổi đã được `git add` và `git commit`
- [ ] Đã `git push origin main`
- [ ] Đã cập nhật `DAILY_LOG.md` ghi lại những gì đã làm
