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
