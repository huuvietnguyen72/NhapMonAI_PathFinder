# Slide Redesign — PathFinder AI

**Ngày:** 2026-05-07  
**File output:** `ThuyetTrinh_PathFinderAI.pptx`  
**Script:** `gen_slides.mjs` (viết lại hoàn toàn)

---

## Tổng quan

Làm lại toàn bộ bộ slide thuyết trình PathFinder AI gồm 13 slide. Thay đổi trên 3 mặt: thiết kế (theme Bold Gradient), nội dung (thêm Demo + Tài liệu tham khảo), và cấu trúc (dời Kiến trúc lên trước Thuật toán).

---

## Theme — Bold Gradient

| Token | Giá trị |
|---|---|
| Nền chính | `linear-gradient(135deg, #0f0c29 → #1e1b4b → #312e81)` |
| Glass card background | `rgba(255,255,255,0.06)` |
| Glass card border | `rgba(129,140,248,0.25)` |
| Accent gradient | `linear-gradient(135deg, #818cf8, #34d399)` |
| Text chính | `#e0e7ff` |
| Text muted | `rgba(255,255,255,0.45)` |
| BFS | `#4ecdc4` |
| DFS | `#ff6b6b` |
| Dijkstra | `#ffd166` |
| A* | `#06d6a0` |

**Yếu tố trang trí toàn slide:**
- Thanh accent dọc 3px bên trái: 2 rect xếp chồng — tím (`#818cf8`, nửa trên) và xanh (`#34d399`, nửa dưới) — mô phỏng gradient
- Lưới nền mờ: không khả thi trong pptxgenjs; bỏ qua hoặc thay bằng vài đường line mờ trang trí góc
- Glow effect: mô phỏng bằng `roundRect` fill `rgba` mờ, không có blur thực sự trong PPTX
- Font: Calibri, toàn bộ
- **Gradient text** (title bìa/cảm ơn): pptxgenjs không hỗ trợ gradient trên text — dùng màu solid `#a5b4fc` (lavender) thay thế, hoặc 2 text box màu khác nhau xếp cạnh nhau nếu cần hiệu ứng
- **Glass card**: mô phỏng bằng fill `rgba(255,255,255,0.06)` + border `rgba(129,140,248,0.25)` — không có `backdrop-filter` thực trong PPTX

---

## Cấu trúc 13 slide

### Slide 1 — Trang bìa
- Icon 🗺️ trong glass card bo tròn (bên trái)
- Tag nhỏ: "Đồ án · Nhập Môn TTNT"
- Title gradient text: "PathFinder AI"
- Subtitle: "Trực Quan Hóa Thuật Toán Tìm Đường / trên Bản Đồ Thực Hà Đông, Hà Nội"
- 4 chip màu: BFS · DFS · Dijkstra · A*
- Meta: trường + năm

### Slide 2 — Mục lục
- 7 numbered card (01–07), layout 2 cột
- Mỗi card: số nổi bật + tên phần
- Cập nhật mục lục theo cấu trúc mới (thêm Demo, Tài liệu TK; dời Kiến trúc)

### Slide 3 — Giới thiệu đề tài
- Đoạn mô tả ngắn
- 4 feature card (icon lớn + tiêu đề + mô tả): Bản đồ thực · Đồng thời · So sánh trực quan · Tương tác

### Slide 4 — Kiến trúc hệ thống *(dời từ vị trí 6)*
- 3 cột glass card: FRONTEND / BACKEND / DỮ LIỆU
- Border màu riêng: teal / yellow / green
- Mũi tên REST API hai chiều giữa Frontend và Backend
- Stack công nghệ trong từng cột

### Slide 5 — Thuật toán — BFS & DFS
- 2 glass card song song, chia đôi slide
- Header card màu riêng (teal cho BFS, coral cho DFS)
- 5 bullet mỗi card
- Label "VS" gradient ở giữa
- Footer note nhận xét so sánh ngắn

### Slide 6 — Thuật toán — Dijkstra & A*
- Layout giống slide 5
- Header yellow (Dijkstra) / green (A*)
- Công thức `f(n) = g(n) + h(n)` và giải thích heuristic Haversine
- Footer note về admissible heuristic

### Slide 7 — Giao diện & Tính năng
- Cột trái: 5 feature row (icon + tiêu đề + mô tả)
- Cột phải: bảng màu 4 thuật toán + ghi chú concentric rings (8px→6px→4px→2px)

### Slide 8 — Demo giao diện *(SLIDE MỚI)*
- Layout 2 cột:
  - Trái (flex 2): placeholder lớn cho screenshot bản đồ + hoạt ảnh 4 algo
  - Phải (flex 1): 2 placeholder nhỏ xếp dọc — bảng thống kê, control panel
- Chú thích nhỏ: dùng ảnh chụp màn hình thực tế khi xuất file
- Border card màu `#34d399`

### Slide 9 — Kết quả so sánh
- Phụ đề: "PTIT → Vincom Hà Đông (~3km)"
- **Bảng (~55% chiều rộng, bên trái):** 4 cột — Thuật toán / Nút duyệt / Độ dài / Thời gian; 4 hàng dữ liệu, xen kẽ nền mờ
- **Nhận xét (phần còn lại, bên phải):** 4 card nhỏ xếp dọc, mỗi card 1 thuật toán:
  - A*: Hiệu quả nhất (~95 nút, nhanh gấp 1.75× Dijkstra)
  - Dijkstra: Tối ưu đảm bảo, chậm hơn do không có định hướng
  - BFS: Ít bước nhất, độ dài thực tế lớn hơn ~14%
  - DFS: Kém nhất — nhiều nút, đường dài nhất

### Slide 10 — Kiểm thử
- 4 stat card to: 34 · 100% · <5s · TDD
- Phần "Phạm vi kiểm thử": 6 item layout 2 cột (Graph · BFS/DFS · Dijkstra/A* · /nodes · /pathfind · Edge cases)

### Slide 11 — Kết luận
- 2 cột glass card:
  - Trái (green border): "Kết quả đạt được" — 6 bullet
  - Phải (yellow border): "Hướng phát triển" — 6 bullet

### Slide 12 — Tài liệu tham khảo *(SLIDE MỚI)*
- 5 mục numbered list `[1]`–`[5]` với số gradient
- Nội dung:
  1. Russell & Norvig — AIMA 4th ed.
  2. OpenStreetMap contributors
  3. Boeing — OSMnx paper, 2017
  4. Leaflet.js + FastAPI
  5. Hart et al. — A* original paper, 1968

### Slide 13 — Cảm ơn
- Centered layout
- Gradient title: "Xin chân thành cảm ơn!"
- Dòng algo: "PathFinder AI — BFS · DFS · Dijkstra · A*"
- Accent bar hai bên (trái + phải)
- Dòng GitHub repo

---

## Thay đổi so với slide cũ

| | Cũ | Mới |
|---|---|---|
| Theme | Dark flat (#1a1a2e) | Bold Gradient (#0f0c29→#312e81) |
| Số slide | 11 | 13 |
| Thứ tự | Kiến trúc ở vị trí 6 | Kiến trúc lên vị trí 4 |
| Slide Demo | Không có | Slide 8 |
| Tài liệu TK | Không có | Slide 12 |
| Slide So sánh | Toàn bảng | Bảng 55% + nhận xét 45% |
| Glass card | Không | Có (backdrop-filter) |

---

## File cần tạo / sửa

- `gen_slides.mjs` — viết lại hoàn toàn với theme và cấu trúc mới
- `ThuyetTrinh_PathFinderAI.pptx` — file output
