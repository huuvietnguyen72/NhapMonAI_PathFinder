# Ứng Dụng Trực Quan Hóa Tìm Đường — Kế Hoạch Triển Khai

> **Dành cho agent thực thi:** BẮT BUỘC dùng skill superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để thực hiện từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Mục tiêu:** Xây dựng ứng dụng web FastAPI + Leaflet.js hiển thị đồng thời hoạt động của BFS, DFS, Dijkstra và A* trên bản đồ đường thật khu vực Hà Đông, Hà Nội.

**Kiến trúc:** Backend Python FastAPI nạp đồ thị từ osmnx khi khởi động, chạy cả 4 thuật toán với mỗi request `/pathfind`, trả về chuỗi các node đã duyệt và đường đi cuối cùng dưới dạng JSON. Frontend Vanilla JS hiển thị bản đồ Leaflet, xử lý click chọn điểm đầu/cuối, gọi API và điều khiển hoạt ảnh theo từng bước.

**Công nghệ:** Python 3.x, FastAPI, uvicorn, osmnx (chỉ dùng để xuất dữ liệu), pytest, httpx, Leaflet.js 1.9.4, Vanilla JS, HTML/CSS

---

## Cấu Trúc File

```
NhapMon_AI/
├── backend/
│   ├── main.py          ← Ứng dụng FastAPI, nạp đồ thị khi khởi động, route /nodes + /pathfind, mount static
│   ├── algorithms.py    ← BFS, DFS, Dijkstra, A* + hàm hỗ trợ reconstruct_path, compute_length, haversine
│   ├── graph.py         ← Class Graph với classmethod load(); dict kề + dict tọa độ
│   └── data_export.py   ← Script xuất dữ liệu một lần → data/nodes.json + data/edges.json
├── data/
│   ├── nodes.json       ← [{id, lat, lng}, ...]  — danh sách nút giao thông
│   └── edges.json       ← [{from, to, weight_m}, ...] — danh sách cạnh (đoạn đường)
├── frontend/
│   ├── index.html       ← Shell SPA; các ID: map, start-info, end-info, speed-slider, btn-run, btn-clear,
│   │                       {bfs,dfs,dijkstra,astar}-{explored,length,time}
│   ├── style.css        ← Giao diện tối màu navy; biến CSS cho màu từng thuật toán
│   └── app.js           ← Khởi tạo bản đồ, lấy dữ liệu node, snapToNearestNode, máy trạng thái click,
│                           startAnimation, drawFinalPaths, updateStats, clearResults
├── tests/
│   ├── conftest.py      ← Thêm backend/ vào sys.path
│   ├── test_graph.py    ← Kiểm thử Graph.load
│   ├── test_algorithms.py ← Kiểm thử unit BFS/DFS/Dijkstra/A*
│   └── test_api.py      ← Kiểm thử endpoint /nodes + /pathfind
├── requirements.txt
└── pytest.ini
```

---

## Task 1: Thiết Lập Dự Án

**Files:**
- Tạo mới: `requirements.txt`
- Tạo mới: `pytest.ini`
- Tạo mới: `tests/conftest.py`

- [ ] **Bước 1: Tạo requirements.txt**

```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
osmnx>=1.9.0
pytest>=7.4.0
httpx>=0.24.0
```

- [ ] **Bước 2: Tạo pytest.ini**

```ini
[pytest]
testpaths = tests
```

- [ ] **Bước 3: Tạo tests/conftest.py**

```python
import sys
from pathlib import Path

# Thêm thư mục backend vào sys.path để các file test import được module backend
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
```

- [ ] **Bước 4: Tạo cấu trúc thư mục**

```bash
mkdir -p backend data frontend tests
touch backend/__init__.py
```

- [ ] **Bước 5: Cài đặt thư viện**

```bash
pip install -r requirements.txt
```

Kết quả mong đợi: tất cả gói cài đặt thành công, không có lỗi.

- [ ] **Bước 6: Kiểm tra pytest tìm được test**

```bash
pytest --collect-only
```

Kết quả mong đợi: `no tests ran` (chưa có file test) — không có lỗi.

- [ ] **Bước 7: Commit**

```bash
git init
git add requirements.txt pytest.ini tests/conftest.py
git commit -m "feat: thiết lập dự án — thư viện, cấu hình pytest"
```

---

## Task 2: Script Xuất Dữ Liệu Bản Đồ

**Files:**
- Tạo mới: `backend/data_export.py`

- [ ] **Bước 1: Tạo backend/data_export.py**

```python
import osmnx as ox
import json
from pathlib import Path


def export_graph(place_name: str, output_dir: str) -> None:
    """Tải đồ thị đường bộ từ OpenStreetMap và xuất ra nodes.json + edges.json."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"Đang tải đồ thị cho: {place_name}")
    G = ox.graph_from_place(place_name, network_type="drive")

    # Xuất danh sách nút (giao lộ)
    nodes = []
    for node_id, data in G.nodes(data=True):
        nodes.append({"id": node_id, "lat": data["y"], "lng": data["x"]})

    # Xuất danh sách cạnh (đoạn đường), weight_m là độ dài tính bằng mét
    edges = []
    for u, v, data in G.edges(data=True):
        edges.append({"from": u, "to": v, "weight_m": round(float(data.get("length", 0)), 2)})

    with open(output_path / "nodes.json", "w", encoding="utf-8") as f:
        json.dump(nodes, f)

    with open(output_path / "edges.json", "w", encoding="utf-8") as f:
        json.dump(edges, f)

    print(f"Đã xuất {len(nodes)} nút và {len(edges)} cạnh vào {output_dir}/")


if __name__ == "__main__":
    export_graph("Hà Đông, Hà Nội, Vietnam", "data")
```

- [ ] **Bước 2: Chạy script xuất dữ liệu (cần internet + osmnx)**

```bash
python backend/data_export.py
```

Kết quả mong đợi:
```
Đang tải đồ thị cho: Hà Đông, Hà Nội, Vietnam
Đã xuất XXXX nút và XXXX cạnh vào data/
```

Kiểm tra: `data/nodes.json` và `data/edges.json` phải tồn tại và không rỗng.

- [ ] **Bước 3: Commit**

```bash
git add backend/data_export.py data/nodes.json data/edges.json
git commit -m "feat: xuất đồ thị đường bộ Hà Đông qua osmnx"
```

---

## Task 3: Bộ Nạp Đồ Thị (TDD)

**Files:**
- Tạo mới: `tests/test_graph.py`
- Tạo mới: `backend/graph.py`

- [ ] **Bước 1: Viết test trước (sẽ fail)**

Tạo `tests/test_graph.py`:

```python
import json
import pytest
from graph import Graph


@pytest.fixture
def sample_data(tmp_path):
    """Tạo dữ liệu mẫu nhỏ để kiểm thử."""
    nodes = [
        {"id": 1, "lat": 0.0, "lng": 0.0},
        {"id": 2, "lat": 0.0, "lng": 1.0},
        {"id": 3, "lat": 1.0, "lng": 1.0},
    ]
    edges = [
        {"from": 1, "to": 2, "weight_m": 10.0},
        {"from": 2, "to": 3, "weight_m": 5.0},
    ]
    nodes_path = tmp_path / "nodes.json"
    edges_path = tmp_path / "edges.json"
    nodes_path.write_text(json.dumps(nodes))
    edges_path.write_text(json.dumps(edges))
    return str(nodes_path), str(edges_path)


def test_nap_toa_do_nut(sample_data):
    g = Graph.load(*sample_data)
    assert g.coords[1] == (0.0, 0.0)
    assert g.coords[2] == (0.0, 1.0)
    assert g.coords[3] == (1.0, 1.0)


def test_nap_dung_so_nut(sample_data):
    g = Graph.load(*sample_data)
    assert len(g.coords) == 3


def test_nap_canh(sample_data):
    g = Graph.load(*sample_data)
    assert (2, 10.0) in g.adjacency[1]
    assert (3, 5.0) in g.adjacency[2]


def test_nut_khong_co_canh_di(sample_data):
    g = Graph.load(*sample_data)
    assert g.adjacency[3] == []
```

- [ ] **Bước 2: Chạy test để xác nhận fail**

```bash
pytest tests/test_graph.py -v
```

Kết quả mong đợi: `ModuleNotFoundError: No module named 'graph'`

- [ ] **Bước 3: Triển khai backend/graph.py**

```python
import json


class Graph:
    """Đồ thị đường bộ có hướng, lưu dưới dạng danh sách kề."""

    def __init__(self):
        # {node_id: [(neighbor_id, weight_m), ...]} — danh sách kề
        self.adjacency: dict[int, list[tuple[int, float]]] = {}
        # {node_id: (lat, lng)} — tọa độ địa lý
        self.coords: dict[int, tuple[float, float]] = {}

    @classmethod
    def load(cls, nodes_path: str, edges_path: str) -> "Graph":
        """Nạp đồ thị từ nodes.json và edges.json."""
        g = cls()

        with open(nodes_path, encoding="utf-8") as f:
            nodes = json.load(f)
        for node in nodes:
            g.coords[node["id"]] = (node["lat"], node["lng"])
            g.adjacency[node["id"]] = []

        with open(edges_path, encoding="utf-8") as f:
            edges = json.load(f)
        for edge in edges:
            g.adjacency[edge["from"]].append((edge["to"], edge["weight_m"]))

        return g
```

- [ ] **Bước 4: Chạy test để xác nhận pass**

```bash
pytest tests/test_graph.py -v
```

Kết quả mong đợi: 4 test passed.

- [ ] **Bước 5: Commit**

```bash
git add tests/test_graph.py backend/graph.py
git commit -m "feat: bộ nạp đồ thị với TDD"
```

---

## Task 4: BFS và DFS (TDD)

**Files:**
- Tạo mới: `tests/test_algorithms.py`
- Tạo mới: `backend/algorithms.py`

- [ ] **Bước 1: Viết test trước (sẽ fail)**

Tạo `tests/test_algorithms.py`:

```python
import pytest
from graph import Graph
from algorithms import bfs, dfs, reconstruct_path, compute_length


@pytest.fixture
def g():
    """
    Đồ thị kiểm thử 5 nút:
    1 --5-- 2 --3-- 3
            |
            7
            |
            4 --2-- 5
    Đường ngắn nhất 1→5: [1,2,4,5], tổng trọng số = 14
    """
    graph = Graph()
    graph.coords = {
        1: (0.0, 0.0), 2: (0.0, 1.0), 3: (0.0, 2.0),
        4: (1.0, 1.0), 5: (1.0, 2.0),
    }
    graph.adjacency = {
        1: [(2, 5.0)],
        2: [(3, 3.0), (4, 7.0)],
        3: [],
        4: [(5, 2.0)],
        5: [],
    }
    return graph


class TestHamHoTro:
    def test_phuc_hoi_duong_di(self):
        parent = {1: None, 2: 1, 3: 2}
        assert reconstruct_path(parent, 1, 3) == [1, 2, 3]

    def test_phuc_hoi_khong_co_duong(self):
        parent = {1: None}
        assert reconstruct_path(parent, 1, 5) == []

    def test_tinh_do_dai(self, g):
        assert compute_length(g, [1, 2, 4, 5]) == 14.0

    def test_do_dai_mot_nut(self, g):
        assert compute_length(g, [1]) == 0.0

    def test_do_dai_rong(self, g):
        assert compute_length(g, []) is None


class TestBFS:
    def test_tim_duoc_duong_di(self, g):
        result = bfs(g, 1, 5)
        assert result["path"] == [1, 2, 4, 5]

    def test_explored_bat_dau_tu_start(self, g):
        result = bfs(g, 1, 5)
        assert result["explored"][0] == 1

    def test_do_dai_duong_di(self, g):
        result = bfs(g, 1, 5)
        assert result["length_m"] == 14.0

    def test_khong_co_duong_tra_rong(self, g):
        result = bfs(g, 3, 5)
        assert result["path"] == []
        assert result["length_m"] is None

    def test_start_bang_end(self, g):
        result = bfs(g, 1, 1)
        assert result["path"] == [1]

    def test_co_time_ms(self, g):
        result = bfs(g, 1, 5)
        assert isinstance(result["time_ms"], float)
        assert result["time_ms"] >= 0


class TestDFS:
    def test_tim_duoc_duong_di(self, g):
        result = dfs(g, 1, 5)
        assert result["path"][0] == 1
        assert result["path"][-1] == 5

    def test_explored_chua_start(self, g):
        result = dfs(g, 1, 5)
        assert 1 in result["explored"]

    def test_khong_co_duong_tra_rong(self, g):
        result = dfs(g, 3, 5)
        assert result["path"] == []
        assert result["length_m"] is None

    def test_co_time_ms(self, g):
        result = dfs(g, 1, 5)
        assert isinstance(result["time_ms"], float)
```

- [ ] **Bước 2: Chạy test để xác nhận fail**

```bash
pytest tests/test_algorithms.py -v
```

Kết quả mong đợi: `ModuleNotFoundError: No module named 'algorithms'`

- [ ] **Bước 3: Triển khai BFS, DFS và hàm hỗ trợ trong backend/algorithms.py**

```python
import heapq
import math
import time
from collections import deque

from graph import Graph


# ── Hàm hỗ trợ ───────────────────────────────────────────────────────────────

def reconstruct_path(parent: dict, start: int, end: int) -> list[int]:
    """Phục hồi đường đi từ dict parent ngược từ end về start."""
    if end not in parent:
        return []
    path = []
    node = end
    while node is not None:
        path.append(node)
        node = parent[node]
    return list(reversed(path))


def compute_length(graph: Graph, path: list[int]) -> float | None:
    """Tính tổng độ dài đường đi (mét). Trả None nếu path rỗng."""
    if len(path) == 0:
        return None
    if len(path) == 1:
        return 0.0
    total = 0.0
    for i in range(len(path) - 1):
        for neighbor, weight in graph.adjacency.get(path[i], []):
            if neighbor == path[i + 1]:
                total += weight
                break
    return round(total, 2)


def haversine(pos1: tuple[float, float], pos2: tuple[float, float]) -> float:
    """Tính khoảng cách đường thẳng (mét) giữa hai điểm (lat, lng)."""
    lat1, lng1 = pos1
    lat2, lng2 = pos2
    R = 6_371_000  # Bán kính Trái Đất (mét)
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _result(explored, path, length_m, start_time) -> dict:
    """Đóng gói kết quả thuật toán thành dict chuẩn."""
    return {
        "explored": explored,
        "path": path,
        "length_m": length_m,
        "time_ms": round((time.time() - start_time) * 1000, 2),
    }


# ── Các thuật toán tìm đường ──────────────────────────────────────────────────

def bfs(graph: Graph, start: int, end: int) -> dict:
    """
    Tìm kiếm theo chiều rộng (BFS).
    Tìm đường đi có ít cạnh nhất (không tính trọng số).
    """
    t0 = time.time()
    queue = deque([start])
    visited = {start}
    parent = {start: None}
    explored = []  # Thứ tự các nút đã duyệt (dùng cho hoạt ảnh)

    while queue:
        node = queue.popleft()
        explored.append(node)
        if node == end:
            break
        for neighbor, _ in graph.adjacency.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = node
                queue.append(neighbor)

    path = reconstruct_path(parent, start, end)
    return _result(explored, path, compute_length(graph, path), t0)


def dfs(graph: Graph, start: int, end: int) -> dict:
    """
    Tìm kiếm theo chiều sâu (DFS).
    Không đảm bảo tìm được đường ngắn nhất.
    """
    t0 = time.time()
    stack = [start]
    visited: set[int] = set()
    parent = {start: None}
    explored = []

    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        explored.append(node)
        if node == end:
            break
        for neighbor, _ in graph.adjacency.get(node, []):
            if neighbor not in visited:
                parent.setdefault(neighbor, node)
                stack.append(neighbor)

    path = reconstruct_path(parent, start, end)
    return _result(explored, path, compute_length(graph, path), t0)
```

- [ ] **Bước 4: Chạy test để xác nhận pass**

```bash
pytest tests/test_algorithms.py::TestHamHoTro tests/test_algorithms.py::TestBFS tests/test_algorithms.py::TestDFS -v
```

Kết quả mong đợi: tất cả test TestHamHoTro, TestBFS, TestDFS pass. TestDijkstra/TestAStar sẽ báo lỗi (chưa import — bình thường).

- [ ] **Bước 5: Commit**

```bash
git add tests/test_algorithms.py backend/algorithms.py
git commit -m "feat: BFS, DFS và hàm hỗ trợ với TDD"
```

---

## Task 5: Dijkstra và A* (TDD)

**Files:**
- Sửa: `tests/test_algorithms.py` (thêm class TestDijkstra + TestAStar)
- Sửa: `backend/algorithms.py` (thêm hàm dijkstra + astar)

- [ ] **Bước 1: Thêm test Dijkstra và A* vào tests/test_algorithms.py**

Đầu tiên, cập nhật dòng import ở đầu file `tests/test_algorithms.py` — thay dòng `from algorithms import ...` hiện tại bằng:

```python
from algorithms import bfs, dfs, dijkstra, astar, reconstruct_path, compute_length
```

Sau đó, thêm hai class này vào cuối file:

```python
class TestDijkstra:
    def test_tim_duong_ngan_nhat(self, g):
        result = dijkstra(g, 1, 5)
        assert result["path"] == [1, 2, 4, 5]
        assert result["length_m"] == 14.0

    def test_explored_bat_dau_tu_start(self, g):
        result = dijkstra(g, 1, 5)
        assert result["explored"][0] == 1

    def test_khong_co_duong_tra_rong(self, g):
        result = dijkstra(g, 3, 5)
        assert result["path"] == []
        assert result["length_m"] is None

    def test_co_time_ms(self, g):
        result = dijkstra(g, 1, 5)
        assert isinstance(result["time_ms"], float)


class TestAStar:
    def test_tim_duong_ngan_nhat(self, g):
        result = astar(g, 1, 5)
        assert result["path"] == [1, 2, 4, 5]
        assert result["length_m"] == 14.0

    def test_khong_co_duong_tra_rong(self, g):
        result = astar(g, 3, 5)
        assert result["path"] == []
        assert result["length_m"] is None

    def test_co_time_ms(self, g):
        result = astar(g, 1, 5)
        assert isinstance(result["time_ms"], float)
```

- [ ] **Bước 2: Chạy test để xác nhận fail**

```bash
pytest tests/test_algorithms.py::TestDijkstra tests/test_algorithms.py::TestAStar -v
```

Kết quả mong đợi: `ImportError: cannot import name 'dijkstra'`

- [ ] **Bước 3: Thêm dijkstra và astar vào backend/algorithms.py**

```python
def dijkstra(graph: Graph, start: int, end: int) -> dict:
    """
    Thuật toán Dijkstra.
    Tìm đường đi ngắn nhất theo tổng trọng số (độ dài mét).
    Dùng hàng đợi ưu tiên (min-heap).
    """
    t0 = time.time()
    heap = [(0.0, start)]
    dist = {start: 0.0}
    parent = {start: None}
    explored = []
    visited: set[int] = set()

    while heap:
        cost, node = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)
        explored.append(node)
        if node == end:
            break
        for neighbor, weight in graph.adjacency.get(node, []):
            new_cost = cost + weight
            if neighbor not in dist or new_cost < dist[neighbor]:
                dist[neighbor] = new_cost
                parent[neighbor] = node
                heapq.heappush(heap, (new_cost, neighbor))

    path = reconstruct_path(parent, start, end)
    length_m = dist.get(end) if path else None
    return _result(explored, path, length_m, t0)


def astar(graph: Graph, start: int, end: int) -> dict:
    """
    Thuật toán A* (A-Star).
    Dijkstra + heuristic khoảng cách đường thẳng Haversine đến đích.
    Duyệt ít nút hơn Dijkstra nhờ hướng tìm kiếm về phía đích.
    """
    t0 = time.time()
    end_pos = graph.coords[end]

    def h(node: int) -> float:
        """Heuristic: khoảng cách đường thẳng từ node đến đích (mét)."""
        return haversine(graph.coords[node], end_pos)

    heap = [(h(start), 0.0, start)]
    g_cost = {start: 0.0}   # Chi phí thực tế từ start đến mỗi nút
    parent = {start: None}
    explored = []
    visited: set[int] = set()

    while heap:
        _, g, node = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)
        explored.append(node)
        if node == end:
            break
        for neighbor, weight in graph.adjacency.get(node, []):
            new_g = g + weight
            if neighbor not in g_cost or new_g < g_cost[neighbor]:
                g_cost[neighbor] = new_g
                parent[neighbor] = node
                # f = g (chi phí thực) + h (ước lượng còn lại)
                heapq.heappush(heap, (new_g + h(neighbor), new_g, neighbor))

    path = reconstruct_path(parent, start, end)
    length_m = g_cost.get(end) if path else None
    return _result(explored, path, length_m, t0)
```

- [ ] **Bước 4: Chạy toàn bộ test thuật toán**

```bash
pytest tests/test_algorithms.py -v
```

Kết quả mong đợi: tất cả test pass.

- [ ] **Bước 5: Commit**

```bash
git add tests/test_algorithms.py backend/algorithms.py
git commit -m "feat: Dijkstra và A* với TDD"
```

---

## Task 6: Ứng Dụng FastAPI (TDD)

**Files:**
- Tạo mới: `tests/test_api.py`
- Tạo mới: `backend/main.py`

- [ ] **Bước 1: Viết test trước (sẽ fail)**

Tạo `tests/test_api.py`:

```python
import json
import os
import pytest

os.environ["TESTING"] = "1"  # Phải đặt trước khi import main

from fastapi.testclient import TestClient
import main
from graph import Graph

# Dữ liệu mẫu: đồ thị 5 nút dùng để kiểm thử
NODES = [
    {"id": 1, "lat": 0.0, "lng": 0.0},
    {"id": 2, "lat": 0.0, "lng": 1.0},
    {"id": 3, "lat": 0.0, "lng": 2.0},
    {"id": 4, "lat": 1.0, "lng": 1.0},
    {"id": 5, "lat": 1.0, "lng": 2.0},
]
EDGES = [
    {"from": 1, "to": 2, "weight_m": 5.0},
    {"from": 2, "to": 3, "weight_m": 3.0},
    {"from": 2, "to": 4, "weight_m": 7.0},
    {"from": 4, "to": 5, "weight_m": 2.0},
]


@pytest.fixture
def client(tmp_path):
    nodes_path = tmp_path / "nodes.json"
    edges_path = tmp_path / "edges.json"
    nodes_path.write_text(json.dumps(NODES))
    edges_path.write_text(json.dumps(EDGES))
    # Inject đồ thị test trực tiếp, bỏ qua lifespan
    main.graph = Graph.load(str(nodes_path), str(edges_path))
    with TestClient(main.app) as c:
        yield c


def test_get_nodes_tra_tat_ca(client):
    response = client.get("/nodes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    assert all("id" in n and "lat" in n and "lng" in n for n in data)


def test_pathfind_tra_ca_4_thuat_toan(client):
    response = client.post("/pathfind", json={"start_node": 1, "end_node": 5})
    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"bfs", "dfs", "dijkstra", "astar"}


def test_pathfind_dijkstra_duong_toi_uu(client):
    response = client.post("/pathfind", json={"start_node": 1, "end_node": 5})
    data = response.json()
    assert data["dijkstra"]["path"] == [1, 2, 4, 5]
    assert data["dijkstra"]["length_m"] == 14.0


def test_pathfind_ket_qua_co_day_du_truong(client):
    response = client.post("/pathfind", json={"start_node": 1, "end_node": 5})
    data = response.json()
    for alg in ["bfs", "dfs", "dijkstra", "astar"]:
        assert "explored" in data[alg]
        assert "path" in data[alg]
        assert "length_m" in data[alg]
        assert "time_ms" in data[alg]


def test_pathfind_nut_bat_dau_khong_ton_tai(client):
    response = client.post("/pathfind", json={"start_node": 9999, "end_node": 5})
    assert response.status_code == 404


def test_pathfind_nut_ket_thuc_khong_ton_tai(client):
    response = client.post("/pathfind", json={"start_node": 1, "end_node": 9999})
    assert response.status_code == 404
```

- [ ] **Bước 2: Chạy test để xác nhận fail**

```bash
pytest tests/test_api.py -v
```

Kết quả mong đợi: `ModuleNotFoundError: No module named 'main'`

- [ ] **Bước 3: Tạo backend/main.py**

```python
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from graph import Graph
from algorithms import bfs, dfs, dijkstra, astar

# Đường dẫn đến thư mục data và frontend
DATA_DIR = Path(__file__).parent.parent / "data"
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"

graph: Graph = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Nạp đồ thị vào bộ nhớ khi server khởi động."""
    global graph
    if not os.getenv("TESTING"):
        # Môi trường thật: nạp từ file JSON đã xuất
        graph = Graph.load(
            str(DATA_DIR / "nodes.json"),
            str(DATA_DIR / "edges.json"),
        )
    yield  # Server đang chạy
    # (Dọn dẹp nếu cần khi server tắt)


app = FastAPI(
    title="PathFinder AI — Hà Đông",
    description="API tìm đường trên bản đồ thật khu vực Hà Đông, Hà Nội",
    lifespan=lifespan,
)

# Cho phép frontend truy cập từ bất kỳ origin nào (cần khi chạy dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PathfindRequest(BaseModel):
    start_node: int   # ID nút bắt đầu
    end_node: int     # ID nút kết thúc


@app.get("/nodes", summary="Lấy toàn bộ danh sách nút")
def get_nodes():
    """Trả về tất cả nút trong đồ thị (dùng cho snapping ở frontend)."""
    return [
        {"id": nid, "lat": lat, "lng": lng}
        for nid, (lat, lng) in graph.coords.items()
    ]


@app.post("/pathfind", summary="Tìm đường giữa 2 nút")
def pathfind(req: PathfindRequest):
    """
    Chạy 4 thuật toán BFS, DFS, Dijkstra, A* và trả kết quả.
    Mỗi kết quả gồm: explored (thứ tự duyệt), path (đường đi), length_m, time_ms.
    """
    if req.start_node not in graph.coords:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy nút bắt đầu: {req.start_node}")
    if req.end_node not in graph.coords:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy nút kết thúc: {req.end_node}")
    return {
        "bfs":      bfs(graph, req.start_node, req.end_node),
        "dfs":      dfs(graph, req.start_node, req.end_node),
        "dijkstra": dijkstra(graph, req.start_node, req.end_node),
        "astar":    astar(graph, req.start_node, req.end_node),
    }


# Phục vụ file tĩnh frontend (chỉ khi thư mục frontend tồn tại)
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
```

- [ ] **Bước 4: Chạy toàn bộ test**

```bash
pytest tests/ -v
```

Kết quả mong đợi: tất cả test pass.

- [ ] **Bước 5: Commit**

```bash
git add tests/test_api.py backend/main.py
git commit -m "feat: ứng dụng FastAPI với endpoint /nodes + /pathfind"
```

---

## Task 7: Frontend HTML + CSS

**Files:**
- Tạo mới: `frontend/index.html`
- Tạo mới: `frontend/style.css`

- [ ] **Bước 1: Tạo frontend/index.html**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PathFinder AI — Hà Đông</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <!-- Thanh điều hướng trên cùng -->
  <nav class="navbar">
    <span class="brand">PathFinder AI</span>
    <span class="nav-sub">PTIT · Hà Đông · Hà Nội</span>
  </nav>

  <div class="layout">
    <!-- Bảng điều khiển bên trái -->
    <aside class="panel">

      <div class="panel-section">
        <span class="label">Điểm Bắt Đầu</span>
        <div id="start-info" class="coord-display">Nhấp vào bản đồ để chọn...</div>
      </div>

      <div class="panel-section">
        <span class="label">Điểm Kết Thúc</span>
        <div id="end-info" class="coord-display">Nhấp vào bản đồ để chọn...</div>
      </div>

      <div class="panel-section">
        <span class="label">Tốc Độ Hoạt Ảnh</span>
        <input id="speed-slider" type="range" min="50" max="500" value="100" step="50" />
        <div class="slider-labels"><span>Nhanh</span><span>Chậm</span></div>
      </div>

      <button id="btn-run" class="btn-primary" disabled>&#9654; Chạy Tất Cả Thuật Toán</button>
      <button id="btn-clear" class="btn-secondary">&#10005; Xóa</button>

      <hr class="divider" />

      <span class="label">Kết Quả</span>

      <!-- Thẻ kết quả cho từng thuật toán -->
      <div class="stat-card" id="card-bfs">
        <div class="stat-title bfs-text">BFS</div>
        <div class="stat-row">Đã duyệt: <span id="bfs-explored">&#8212;</span></div>
        <div class="stat-row">Độ dài: <span id="bfs-length">&#8212;</span></div>
        <div class="stat-row">Thời gian: <span id="bfs-time">&#8212;</span></div>
      </div>

      <div class="stat-card" id="card-dfs">
        <div class="stat-title dfs-text">DFS</div>
        <div class="stat-row">Đã duyệt: <span id="dfs-explored">&#8212;</span></div>
        <div class="stat-row">Độ dài: <span id="dfs-length">&#8212;</span></div>
        <div class="stat-row">Thời gian: <span id="dfs-time">&#8212;</span></div>
      </div>

      <div class="stat-card" id="card-dijkstra">
        <div class="stat-title dijkstra-text">Dijkstra</div>
        <div class="stat-row">Đã duyệt: <span id="dijkstra-explored">&#8212;</span></div>
        <div class="stat-row">Độ dài: <span id="dijkstra-length">&#8212;</span></div>
        <div class="stat-row">Thời gian: <span id="dijkstra-time">&#8212;</span></div>
      </div>

      <div class="stat-card" id="card-astar">
        <div class="stat-title astar-text">A*</div>
        <div class="stat-row">Đã duyệt: <span id="astar-explored">&#8212;</span></div>
        <div class="stat-row">Độ dài: <span id="astar-length">&#8212;</span></div>
        <div class="stat-row">Thời gian: <span id="astar-time">&#8212;</span></div>
      </div>

    </aside>

    <!-- Khung bản đồ Leaflet chiếm phần còn lại -->
    <main id="map"></main>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Bước 2: Tạo frontend/style.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-dark:   #1a1a2e;   /* Nền tối nhất */
  --bg-mid:    #16213e;   /* Nền panel */
  --bg-light:  #0f3460;   /* Nền thẻ */
  --accent:    #e94560;   /* Màu nhấn (đỏ) */
  --text:      #eeeeee;
  --muted:     #aaaaaa;
  /* Màu riêng từng thuật toán */
  --bfs:       #4ecdc4;
  --dfs:       #ff6b6b;
  --dijkstra:  #ffd166;
  --astar:     #06d6a0;
}

body {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-dark);
  color: var(--text);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
}

/* Thanh điều hướng */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: var(--bg-dark);
  border-bottom: 1px solid var(--bg-light);
  flex-shrink: 0;
}
.brand   { font-weight: 700; font-size: 15px; color: var(--accent); }
.nav-sub { color: var(--muted); font-size: 12px; }

/* Layout 2 cột */
.layout { display: flex; flex: 1; overflow: hidden; }

/* Panel bên trái */
.panel {
  width: 260px;
  min-width: 260px;
  background: var(--bg-mid);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  border-right: 1px solid var(--bg-light);
}

.panel-section { display: flex; flex-direction: column; gap: 5px; }

.label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.coord-display {
  background: var(--bg-light);
  border-radius: 6px;
  padding: 8px 10px;
  color: #7fdbff;
  min-height: 34px;
  font-size: 12px;
}

/* Thanh kéo tốc độ */
#speed-slider { width: 100%; accent-color: var(--accent); cursor: pointer; margin-top: 2px; }
.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--muted);
}

/* Nút bấm */
.btn-primary {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-primary:not(:disabled):hover { opacity: 0.85; }

.btn-secondary {
  background: var(--bg-light);
  color: var(--muted);
  border: 1px solid #2a2a4a;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s;
}
.btn-secondary:hover { color: var(--text); }

.divider { border: none; border-top: 1px solid var(--bg-light); }

/* Thẻ kết quả */
.stat-card {
  background: var(--bg-light);
  border-radius: 6px;
  padding: 8px 10px;
  border-left: 3px solid;
}
#card-bfs      { border-color: var(--bfs); }
#card-dfs      { border-color: var(--dfs); }
#card-dijkstra { border-color: var(--dijkstra); }
#card-astar    { border-color: var(--astar); }

.stat-title { font-weight: 700; font-size: 12px; margin-bottom: 4px; }
.bfs-text      { color: var(--bfs); }
.dfs-text      { color: var(--dfs); }
.dijkstra-text { color: var(--dijkstra); }
.astar-text    { color: var(--astar); }

.stat-row         { color: var(--muted); line-height: 1.7; }
.stat-row span    { color: var(--text); font-weight: 600; }

/* Bản đồ chiếm toàn bộ không gian còn lại */
#map { flex: 1; }
```

- [ ] **Bước 3: Kiểm tra giao diện hiển thị (chưa có JS)**

```bash
cd backend && python -m uvicorn main:app --reload
```

Mở http://localhost:8000 — phải thấy thanh navbar tối + panel bên trái + vùng bản đồ trống.

- [ ] **Bước 4: Commit**

```bash
git add frontend/index.html frontend/style.css
git commit -m "feat: giao diện HTML và CSS theme tối"
```

---

## Task 8: Frontend JS — Khởi Tạo và Snap Điểm Gần Nhất

**Files:**
- Tạo mới: `frontend/app.js`

- [ ] **Bước 1: Tạo frontend/app.js với khởi tạo bản đồ, lấy dữ liệu node và hàm hỗ trợ**

```js
// ── Hằng số ───────────────────────────────────────────────────────────────────
const PTIT_CENTER = [20.9731, 105.7789]; // Tọa độ trung tâm khu vực PTIT Hà Đông
const COLORS = { bfs: '#4ecdc4', dfs: '#ff6b6b', dijkstra: '#ffd166', astar: '#06d6a0' };
const ALGS = ['bfs', 'dfs', 'dijkstra', 'astar'];

// ── Trạng thái ứng dụng ───────────────────────────────────────────────────────
let graphNodes = [];   // Mảng [{id, lat, lng}] — toàn bộ nút đồ thị
let state = 0;         // 0=chờ chọn start, 1=chờ chọn end, 2=đã chạy/đang chạy
let startNode = null;
let endNode = null;
let animationId = null; // ID của setInterval hiện tại

// ── Khởi tạo bản đồ Leaflet ───────────────────────────────────────────────────
const map = L.map('map').setView(PTIT_CENTER, 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
}).addTo(map);

// ── Layer cho từng thuật toán ─────────────────────────────────────────────────
const markerLayer = L.layerGroup().addTo(map); // Marker điểm S và E
const exploredLayers = {};  // Layer chấm tròn các nút đã duyệt
const pathLayers = {};      // Layer đường đi cuối cùng
for (const alg of ALGS) {
  exploredLayers[alg] = L.layerGroup().addTo(map);
  pathLayers[alg]     = L.layerGroup().addTo(map);
}

// ── Lấy dữ liệu nút từ server ─────────────────────────────────────────────────
fetch('/nodes')
  .then(r => r.json())
  .then(nodes => { graphNodes = nodes; })
  .catch(err => console.error('Không thể tải dữ liệu nút:', err));

// ── Hàm hỗ trợ ───────────────────────────────────────────────────────────────

/**
 * Tìm nút gần nhất với tọa độ click trên bản đồ.
 * Dùng khoảng cách Euclid trên tọa độ độ (chấp nhận được với bản đồ nhỏ).
 */
function snapToNearestNode(lat, lng) {
  let nearest = null, minDist = Infinity;
  for (const node of graphNodes) {
    const d = Math.hypot(node.lat - lat, node.lng - lng);
    if (d < minDist) { minDist = d; nearest = node; }
  }
  return nearest;
}

/**
 * Xóa toàn bộ kết quả trên bản đồ và reset bảng thống kê.
 */
function clearResults() {
  for (const alg of ALGS) {
    exploredLayers[alg].clearLayers();
    pathLayers[alg].clearLayers();
    document.getElementById(`${alg}-explored`).textContent = '—';
    document.getElementById(`${alg}-length`).textContent   = '—';
    document.getElementById(`${alg}-time`).textContent     = '—';
  }
  if (animationId) { clearInterval(animationId); animationId = null; }
}
```

- [ ] **Bước 2: Khởi động server và kiểm tra bản đồ hiển thị**

```bash
cd backend && python -m uvicorn main:app --reload
```

Mở http://localhost:8000 — bản đồ OpenStreetMap khu vực Hà Đông phải hiện ra.
Mở DevTools → tab Network → kiểm tra `/nodes` trả về mảng JSON có `id`, `lat`, `lng`.

- [ ] **Bước 3: Commit**

```bash
git add frontend/app.js
git commit -m "feat: khởi tạo bản đồ, lấy node, hàm snap"
```

---

## Task 9: Frontend JS — Máy Trạng Thái Click và Gọi API

**Files:**
- Sửa: `frontend/app.js` (thêm vào cuối file)

- [ ] **Bước 1: Thêm xử lý click và nút bấm vào frontend/app.js**

```js
// ── Tạo marker điểm S/E trên bản đồ ─────────────────────────────────────────

function makeMarker(node, label, color) {
  // Marker dạng giọt nước với nhãn S hoặc E
  const icon = L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#fff;border-radius:50% 50% 50% 0;
                       width:22px;height:22px;display:flex;align-items:center;
                       justify-content:center;font-weight:700;font-size:11px;
                       transform:rotate(-45deg);border:2px solid #fff;">
             <span style="transform:rotate(45deg)">${label}</span>
           </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
  return L.marker([node.lat, node.lng], { icon });
}

// ── Xử lý sự kiện click trên bản đồ ─────────────────────────────────────────
//
// Máy trạng thái:
//   0 → click → đặt S → chuyển state 1
//   1 → click → đặt E → kích hoạt nút Run → chuyển state 2
//   2 → click → reset về state 0 (sẵn sàng chọn điểm mới)

map.on('click', (e) => {
  const node = snapToNearestNode(e.latlng.lat, e.latlng.lng);
  if (!node) return;

  if (state === 0) {
    // Chọn điểm bắt đầu
    markerLayer.clearLayers();
    clearResults();
    startNode = node;
    makeMarker(node, 'S', '#e94560').addTo(markerLayer);
    document.getElementById('start-info').textContent =
      `${node.lat.toFixed(5)}, ${node.lng.toFixed(5)}`;
    document.getElementById('end-info').textContent = 'Nhấp vào bản đồ để chọn...';
    endNode = null;
    document.getElementById('btn-run').disabled = true;
    state = 1;

  } else if (state === 1) {
    // Chọn điểm kết thúc
    endNode = node;
    makeMarker(node, 'E', '#06d6a0').addTo(markerLayer);
    document.getElementById('end-info').textContent =
      `${node.lat.toFixed(5)}, ${node.lng.toFixed(5)}`;
    document.getElementById('btn-run').disabled = false;
    state = 2;

  } else {
    // Reset — click lần 3 trở đi xóa tất cả
    state = 0;
    startNode = null;
    endNode = null;
    markerLayer.clearLayers();
    clearResults();
    document.getElementById('start-info').textContent = 'Nhấp vào bản đồ để chọn...';
    document.getElementById('end-info').textContent   = 'Nhấp vào bản đồ để chọn...';
    document.getElementById('btn-run').disabled = true;
  }
});

// ── Nút Xóa ──────────────────────────────────────────────────────────────────
document.getElementById('btn-clear').addEventListener('click', () => {
  state = 0;
  startNode = null;
  endNode = null;
  markerLayer.clearLayers();
  clearResults();
  document.getElementById('start-info').textContent = 'Nhấp vào bản đồ để chọn...';
  document.getElementById('end-info').textContent   = 'Nhấp vào bản đồ để chọn...';
  document.getElementById('btn-run').disabled = true;
});

// ── Nút Chạy Thuật Toán ───────────────────────────────────────────────────────
document.getElementById('btn-run').addEventListener('click', async () => {
  const btn = document.getElementById('btn-run');
  btn.disabled = true;
  btn.textContent = 'Đang chạy...';
  clearResults();

  try {
    const res = await fetch('/pathfind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_node: startNode.id, end_node: endNode.id }),
    });
    if (!res.ok) throw new Error(`Lỗi server: ${res.status}`);
    const results = await res.json();
    startAnimation(results); // Hàm này được định nghĩa ở Task 10
  } catch (err) {
    console.error('Tìm đường thất bại:', err);
    alert('Tìm đường thất bại. Kiểm tra console để xem chi tiết.');
  } finally {
    btn.textContent = '▶ Chạy Tất Cả Thuật Toán';
    btn.disabled = false;
  }
});
```

- [ ] **Bước 2: Kiểm tra tương tác thủ công**

Khởi động server, mở http://localhost:8000.
- Click lần 1 → marker đỏ **S** xuất hiện, tọa độ hiện trong panel
- Click lần 2 → marker xanh **E** xuất hiện, nút "Chạy" được kích hoạt
- Click lần 3 → toàn bộ reset
- Nhấn nút "Xóa" → toàn bộ reset

- [ ] **Bước 3: Commit**

```bash
git add frontend/app.js
git commit -m "feat: máy trạng thái click và gọi API tìm đường"
```

---

## Task 10: Frontend JS — Hoạt Ảnh, Đường Đi Cuối và Thống Kê

**Files:**
- Sửa: `frontend/app.js` (thêm vào cuối file)

- [ ] **Bước 1: Thêm hàm hoạt ảnh vào frontend/app.js**

```js
// ── Hoạt ảnh tìm kiếm ────────────────────────────────────────────────────────

function startAnimation(results) {
  // Tạo map tra cứu nhanh: node ID → {lat, lng}
  const nodeMap = {};
  for (const node of graphNodes) nodeMap[node.id] = node;

  const BATCH = 10;   // Số nút vẽ mỗi tick (mỗi lần setInterval kích hoạt)
  const indices = { bfs: 0, dfs: 0, dijkstra: 0, astar: 0 };
  let lastSpeed = parseInt(document.getElementById('speed-slider').value);

  function tick() {
    let allDone = true;

    // Mỗi tick: vẽ thêm BATCH nút cho từng thuật toán
    for (const alg of ALGS) {
      const explored = results[alg].explored;
      const end = Math.min(indices[alg] + BATCH, explored.length);
      for (let i = indices[alg]; i < end; i++) {
        const node = nodeMap[explored[i]];
        if (node) {
          L.circleMarker([node.lat, node.lng], {
            radius: 3,
            color: COLORS[alg],
            fillColor: COLORS[alg],
            fillOpacity: 0.5,
            weight: 0,
          }).addTo(exploredLayers[alg]);
        }
      }
      indices[alg] = end;
      if (indices[alg] < explored.length) allDone = false;
    }

    // Khi tất cả thuật toán duyệt xong → vẽ đường đi cuối cùng
    if (allDone) {
      clearInterval(animationId);
      animationId = null;
      drawFinalPaths(results, nodeMap);
      updateStats(results);
      return;
    }

    // Cập nhật tốc độ động từ thanh kéo
    const newSpeed = parseInt(document.getElementById('speed-slider').value);
    if (newSpeed !== lastSpeed) {
      clearInterval(animationId);
      lastSpeed = newSpeed;
      animationId = setInterval(tick, lastSpeed);
    }
  }

  animationId = setInterval(tick, lastSpeed);
}

// ── Vẽ đường đi cuối cùng ────────────────────────────────────────────────────

function drawFinalPaths(results, nodeMap) {
  const allLatLngs = [];

  for (const alg of ALGS) {
    // Làm mờ các chấm đã duyệt (giữ lại để so sánh)
    exploredLayers[alg].eachLayer(layer => {
      if (layer.setStyle) layer.setStyle({ fillOpacity: 0.15, opacity: 0 });
    });

    // Vẽ đường đi cuối bằng polyline đậm
    const path = results[alg].path;
    if (path.length > 1) {
      const latlngs = path
        .map(id => nodeMap[id])
        .filter(Boolean)
        .map(n => [n.lat, n.lng]);
      L.polyline(latlngs, { color: COLORS[alg], weight: 4, opacity: 0.9 })
        .addTo(pathLayers[alg]);
      allLatLngs.push(...latlngs);
    }
  }

  // Tự động zoom để hiển thị toàn bộ đường đi
  if (allLatLngs.length > 0) {
    map.fitBounds(L.latLngBounds(allLatLngs).pad(0.15));
  }
}

// ── Cập nhật bảng thống kê ───────────────────────────────────────────────────

function updateStats(results) {
  for (const alg of ALGS) {
    const r = results[alg];
    document.getElementById(`${alg}-explored`).textContent =
      r.explored.length.toLocaleString('vi-VN');  // Định dạng số kiểu Việt Nam
    document.getElementById(`${alg}-length`).textContent =
      r.length_m !== null ? `${(r.length_m / 1000).toFixed(2)} km` : 'N/A';
    document.getElementById(`${alg}-time`).textContent =
      `${r.time_ms} ms`;
  }
}
```

- [ ] **Bước 2: Kiểm tra toàn bộ luồng thủ công**

Mở http://localhost:8000.
- Chọn điểm đầu → chọn điểm cuối → nhấn "Chạy Tất Cả Thuật Toán"
- Kiểm tra: chấm màu lan ra từ điểm đầu đồng thời cho cả 4 thuật toán
- Kiểm tra: khi hoạt ảnh kết thúc, đường đi đậm được vẽ, bảng thống kê điền đầy đủ
- Kiểm tra: kéo thanh tốc độ trong khi đang chạy → tốc độ thay đổi ngay
- Kiểm tra: bản đồ tự zoom để hiển thị hết đường đi

- [ ] **Bước 3: Commit**

```bash
git add frontend/app.js
git commit -m "feat: hoạt ảnh tìm kiếm, vẽ đường cuối, bảng thống kê"
```

---

## Task 11: Kiểm Thử Tổng Thể

- [ ] **Bước 1: Chạy toàn bộ bộ test**

```bash
pytest tests/ -v
```

Kết quả mong đợi: tất cả test pass.

- [ ] **Bước 2: Khởi động server**

```bash
cd backend && python -m uvicorn main:app --reload --port 8000
```

- [ ] **Bước 3: Kiểm tra toàn bộ luồng trên bản đồ thật**

Mở http://localhost:8000.

Danh sách kiểm tra:
- [ ] Bản đồ tải đúng, tập trung vào khu vực PTIT Hà Đông
- [ ] Click trên bản đồ → marker S được snap vào nút đường gần nhất
- [ ] Click lần 2 → marker E xuất hiện, nút "Chạy" kích hoạt
- [ ] Nhấn "Chạy Tất Cả Thuật Toán" → DevTools Network tab thấy POST `/pathfind`
- [ ] Hoạt ảnh 4 màu lan ra đồng thời trên bản đồ
- [ ] Sau hoạt ảnh: 4 đường đi đậm được vẽ, bảng thống kê hiện đầy đủ
- [ ] A* duyệt ít nút hơn BFS và Dijkstra (đặc trưng của thuật toán)
- [ ] Nút "Xóa" reset hoàn toàn

- [ ] **Bước 4: Commit cuối**

```bash
git add .
git commit -m "feat: hoàn thành ứng dụng trực quan hóa tìm đường"
```
