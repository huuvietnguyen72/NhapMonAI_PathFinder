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
