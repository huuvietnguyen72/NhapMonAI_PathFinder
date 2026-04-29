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


def _result(explored: list, path: list[int], length_m: float | None, start_time: float) -> dict:
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
                parent.setdefault(neighbor, node)  # setdefault: chỉ ghi lần đầu, giữ đường đi đầu tiên tìm thấy
                stack.append(neighbor)

    path = reconstruct_path(parent, start, end)
    return _result(explored, path, compute_length(graph, path), t0)


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
