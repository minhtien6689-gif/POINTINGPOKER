# ♠️ POINTINGPOKER — WEB APP TÍNH ĐIỂM TIẾN LÊN MIỀN NAM THÔNG MINH

> **Ứng dụng Web Single Page Application (SPA) tính và ghi điểm thông minh cho môn bài Tiến lên miền Nam.**  
> Thiết kế theo chuẩn **Mr Tien Web Design System** với phong cách **Neumorphism Pastel (Cam & Hồng)**, **Animated Mesh Gradient**, cùng **Bảng LED thương hiệu © 2026 Mr Tiến**.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Giao Diện Mobile-First Tối Ưu:**
   - Thao tác mượt mà bằng một tay trên điện thoại khi ngồi đánh bài.
   - Các nút chọn thứ hạng Nhất, Nhì, Ba, Chót to bản dạng Toggle Button, tự động chuyển đổi thông minh không sợ bấm trùng.
   - Thống kê tinh gọn (Pill Stats) 1 hàng ngang, bảng xếp hạng thẻ Neumorphic sang trọng.

2. **Logic Tính Điểm Thông Minh & Chuẩn Xác 100%:**
   - **Thứ hạng cơ bản:** Nhất (+3đ), Nhì (+2đ), Ba (+1đ), Chót (0đ).
   - **Ngoại lệ 1 — Tới Trắng:** Người tới trắng nhận **+9 điểm**, 3 người thua được **0 điểm**, tự động bỏ qua chặt heo và cóng.
   - **Chặt Heo / Hàng:**
     - 🐷 Heo Đen: Chặt +1đ, Bị chặt -1đ.
     - 🔴 Heo Đỏ: Chặt +2đ, Bị chặt -2đ.
     - Mở rộng: Đôi heo đen (+2/-2), Đôi heo đỏ (+4/-4), 3 đôi thông (+3/-3), Tứ quý (+4/-4), 4 đôi thông (+5/-5).
     - Hỗ trợ cộng dồn nhiều pha chặt trong cùng 1 ván.
   - **Ngoại lệ 2 — Cóng & Đền Cóng:** Phạt cơ bản **-6 điểm/người**:
     - *Không ai đền:* Người cóng tự chịu -6đ. Người Về Nhất nhận trọn vẹn toàn bộ điểm phạt (+6, +12 hoặc +18đ).
     - *Đền Cóng:* Người đền gánh thay toàn bộ điểm phạt, người cóng thực tế không bị trừ điểm nào (0đ). Người Về Nhất vẫn nhận trọn vẹn số điểm phạt.

3. **Xem Trước Điểm Tức Thời (Live Score Preview):**
   - Xem ngay trước khi lưu ván bài, minh bạch chi tiết từng lý do cộng/trừ điểm.

4. **Lịch Sử & Hoàn Tác (Undo):**
   - Bảng lịch sử ván bài hiển thị chi tiết theo thứ tự mới nhất.
   - Nút hoàn tác (Undo) giúp sửa sai ngay lập tức khi lỡ bấm nhầm điểm.

5. **Kết Thúc Trận Đấu (Game Over) Đẳng Cấp:**
   - Kích hoạt khi có ít nhất 1 người chạm "Điểm đích" (mặc định 50 điểm).
   - Nổ pháo hoa rực rỡ (Canvas Confetti) cùng hiệu ứng âm thanh chiến thắng hào hùng (Victory Fanfare).
   - Bảng vinh danh Quán Quân, Á Quân, Hạng Ba, Đội Sổ kèm cúp vàng 🏆 và huy chương.
   - Nút sao chép tóm tắt kết quả sẵn sàng gửi ngay vào nhóm Zalo / Messenger.

6. **Lưu Trữ Tự Động (LocalStorage):**
   - Điểm số và lịch sử ván đấu được bảo toàn 100% kể cả khi tắt trình duyệt hay tải lại trang.

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

- **Giao diện & Cốt lõi:** HTML5, CSS3 hiện đại, Vanilla JavaScript (ES6+).
- **Hệ thống Design:** Neumorphism Pastel (Cam & Hồng), 6 Khối Mesh Gradient, Bảng LED Neon Marquee.
- **Quản lý State:** Reactive Store Pattern (tương đương Zustand / Context API).
- **Âm thanh:** Web Audio API Sound Synthesizer (tự tạo âm thanh Tap, Rank, Chop, Cong, Fanfare trực tiếp bằng code).
- **Hiệu ứng:** Canvas Confetti.
- **Font chữ:** Google Fonts (`Outfit`, `Plus Jakarta Sans`, `Orbitron`, `Inter`).

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI

### Chạy Cục Bộ (Local)
Mở trực tiếp file `index.html` trên trình duyệt hoặc dùng HTTP Server:
```bash
npx serve .
# hoặc
python -m http.server 8080
```

### Triển Khai Lên Vercel
```bash
vercel --prod --yes
```

---

## 👨‍💻 TÁC GIẢ & BẢN QUYỀN

- **Phát triển bởi:** Mr Tiến
- **Năm:** © 2026 Mr Tiến. All rights reserved.
