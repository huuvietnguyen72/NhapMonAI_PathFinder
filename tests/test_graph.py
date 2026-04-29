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
