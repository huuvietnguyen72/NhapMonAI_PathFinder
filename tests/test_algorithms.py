import pytest
from graph import Graph
from algorithms import bfs, dfs, dijkstra, astar, reconstruct_path, compute_length


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
