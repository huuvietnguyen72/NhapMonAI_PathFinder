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
