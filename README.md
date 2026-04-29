# PathFinder AI — Trực Quan Hóa Thuật Toán Tìm Đường

Ứng dụng web hiển thị đồng thời hoạt động của 4 thuật toán tìm đường (**BFS, DFS, Dijkstra, A\***) trên bản đồ thật khu vực **Hà Đông, Hà Nội**.

> Đồ án môn Nhập Môn Trí Tuệ Nhân Tạo — PTIT (Học viện Công nghệ Bưu chính Viễn thông)

---

## Tính năng

- Chọn điểm đầu và điểm cuối trực tiếp trên bản đồ
- Chạy đồng thời 4 thuật toán, hiển thị hoạt ảnh từng bước khám phá
- So sánh số nút duyệt, độ dài đường đi và thời gian thực thi
- Ẩn/hiện từng thuật toán bằng cách click vào thẻ kết quả
- Điều chỉnh tốc độ hoạt ảnh theo thời gian thực

## Giao diện

| Thuật toán | Màu | Độ dày đường |
|---|---|---|
| BFS | Teal `#4ecdc4` | 8px |
| DFS | Đỏ `#ff6b6b` | 6px |
| Dijkstra | Vàng `#ffd166` | 4px |
| A* | Xanh lá `#06d6a0` | 2px |

Khi các thuật toán tìm cùng một đường, các đường hiển thị dạng **vòng đồng tâm** — tất cả 4 màu đều nhìn thấy cùng lúc.

---

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend | Python 3.x, FastAPI, uvicorn |
| Frontend | Vanilla JS, Leaflet.js 1.9.4, HTML/CSS |
| Dữ liệu bản đồ | osmnx (xuất một lần từ OpenStreetMap) |
| Kiểm thử | pytest, httpx |

---

## Cài đặt và chạy

### 1. Clone repo

```bash
git clone https://github.com/huuvietnguyen72/NhapMonAI_PathFinder.git
cd NhapMonAI_PathFinder
```

### 2. Cài đặt thư viện

```bash
pip install -r requirements.txt
```

### 3. Khởi động server

```bash
cd backend
python -m uvicorn main:app --port 8000 --reload
```

Mở trình duyệt tại **http://localhost:8000**

---

## Cấu trúc dự án

```
NhapMonAI_PathFinder/
├── backend/
│   ├── main.py          ← FastAPI: route /nodes + /pathfind
│   ├── algorithms.py    ← BFS, DFS, Dijkstra, A*
│   ├── graph.py         ← Nạp đồ thị từ JSON
│   └── data_export.py   ← Xuất dữ liệu bản đồ (chạy một lần)
├── data/
│   ├── nodes.json       ← 1007 nút giao thông Hà Đông
│   └── edges.json       ← 2644 cạnh đường bộ
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── tests/               ← 34 unit tests
├── docs/                ← Spec thiết kế và kế hoạch triển khai
├── requirements.txt
└── pytest.ini
```

---

## Chạy kiểm thử

```bash
pytest tests/ -v
```

---

## API

### `GET /nodes`
Trả về toàn bộ danh sách nút trong đồ thị.

### `POST /pathfind`
```json
{ "start_node": 123456, "end_node": 654321 }
```
Trả về kết quả của 4 thuật toán:
```json
{
  "bfs":      { "explored": [...], "path": [...], "length_m": 2400, "time_ms": 18 },
  "dfs":      { "explored": [...], "path": [...], "length_m": 4100, "time_ms": 22 },
  "dijkstra": { "explored": [...], "path": [...], "length_m": 2100, "time_ms": 14 },
  "astar":    { "explored": [...], "path": [...], "length_m": 2100, "time_ms": 8  }
}
```
