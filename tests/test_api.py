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


def test_pathfind_khong_co_duong(client):
    # Nút 5 không có cạnh đi ra, không có đường nào từ 5 → 1
    response = client.post("/pathfind", json={"start_node": 5, "end_node": 1})
    assert response.status_code == 200
    data = response.json()
    assert data["dijkstra"]["path"] == []
    assert data["dijkstra"]["length_m"] is None
