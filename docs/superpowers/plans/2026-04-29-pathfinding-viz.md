# Pathfinding Visualization App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI + Leaflet.js web app that animates BFS, DFS, Dijkstra, and A* simultaneously on a real road map of Hà Đông district, Hanoi.

**Architecture:** Python FastAPI backend loads a pre-exported osmnx graph at startup and runs all four algorithms on each `/pathfind` request, returning explored-node sequences and final paths as JSON. A Vanilla JS frontend renders the Leaflet map, handles click-to-set-start/end, fetches results, and drives a tick-based animation showing exploration then final paths.

**Tech Stack:** Python 3.x, FastAPI, uvicorn, osmnx (export only), pytest, httpx, Leaflet.js 1.9.4, Vanilla JS, HTML/CSS

---

## File Structure

```
NhapMon_AI/
├── backend/
│   ├── main.py          ← FastAPI app, lifespan graph load, /nodes + /pathfind routes, static mount
│   ├── algorithms.py    ← BFS, DFS, Dijkstra, A* + helpers reconstruct_path, compute_length, haversine
│   ├── graph.py         ← Graph class with load() classmethod; adjacency dict + coords dict
│   └── data_export.py   ← One-time osmnx export script → data/nodes.json + data/edges.json
├── data/
│   ├── nodes.json       ← [{id, lat, lng}, ...]
│   └── edges.json       ← [{from, to, weight_m}, ...]
├── frontend/
│   ├── index.html       ← SPA shell; IDs: map, start-info, end-info, speed-slider, btn-run, btn-clear,
│   │                       {bfs,dfs,dijkstra,astar}-{explored,length,time}
│   ├── style.css        ← Dark navy theme; CSS vars for algorithm colors
│   └── app.js           ← Map init, node fetch, snapToNearestNode, click state machine,
│                           startAnimation, drawFinalPaths, updateStats, clearResults
├── tests/
│   ├── conftest.py      ← Adds backend/ to sys.path
│   ├── test_graph.py    ← Graph.load tests
│   ├── test_algorithms.py ← BFS/DFS/Dijkstra/A* unit tests
│   └── test_api.py      ← /nodes + /pathfind endpoint tests
├── requirements.txt
└── pytest.ini
```

---

## Task 1: Project Setup

**Files:**
- Create: `requirements.txt`
- Create: `pytest.ini`
- Create: `tests/conftest.py`

- [ ] **Step 1: Create requirements.txt**

```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
osmnx>=1.9.0
pytest>=7.4.0
httpx>=0.24.0
```

- [ ] **Step 2: Create pytest.ini**

```ini
[pytest]
testpaths = tests
```

- [ ] **Step 3: Create tests/conftest.py**

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
```

- [ ] **Step 4: Create directory structure**

```bash
mkdir -p backend data frontend tests
touch backend/__init__.py
```

- [ ] **Step 5: Install dependencies**

```bash
pip install -r requirements.txt
```

Expected: all packages install without errors.

- [ ] **Step 6: Verify pytest finds tests**

```bash
pytest --collect-only
```

Expected: `no tests ran` (no test files yet) — no errors.

- [ ] **Step 7: Commit**

```bash
git init
git add requirements.txt pytest.ini tests/conftest.py
git commit -m "feat: project setup — deps, pytest config"
```

---

## Task 2: Data Export Script

**Files:**
- Create: `backend/data_export.py`

- [ ] **Step 1: Create backend/data_export.py**

```python
import osmnx as ox
import json
from pathlib import Path


def export_graph(place_name: str, output_dir: str) -> None:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"Downloading graph for: {place_name}")
    G = ox.graph_from_place(place_name, network_type="drive")

    nodes = []
    for node_id, data in G.nodes(data=True):
        nodes.append({"id": node_id, "lat": data["y"], "lng": data["x"]})

    edges = []
    for u, v, data in G.edges(data=True):
        edges.append({"from": u, "to": v, "weight_m": round(float(data.get("length", 0)), 2)})

    with open(output_path / "nodes.json", "w", encoding="utf-8") as f:
        json.dump(nodes, f)

    with open(output_path / "edges.json", "w", encoding="utf-8") as f:
        json.dump(edges, f)

    print(f"Exported {len(nodes)} nodes and {len(edges)} edges to {output_dir}/")


if __name__ == "__main__":
    export_graph("Hà Đông, Hà Nội, Vietnam", "data")
```

- [ ] **Step 2: Run the export (requires internet + osmnx)**

```bash
python backend/data_export.py
```

Expected output:
```
Downloading graph for: Hà Đông, Hà Nội, Vietnam
Exported XXXX nodes and XXXX edges to data/
```

Verify files exist: `data/nodes.json` and `data/edges.json` — both non-empty JSON arrays.

- [ ] **Step 3: Commit**

```bash
git add backend/data_export.py data/nodes.json data/edges.json
git commit -m "feat: export Hà Đông road graph via osmnx"
```

---

## Task 3: Graph Loader (TDD)

**Files:**
- Create: `tests/test_graph.py`
- Create: `backend/graph.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_graph.py`:

```python
import json
import pytest
from graph import Graph


@pytest.fixture
def sample_data(tmp_path):
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


def test_loads_node_coords(sample_data):
    g = Graph.load(*sample_data)
    assert g.coords[1] == (0.0, 0.0)
    assert g.coords[2] == (0.0, 1.0)
    assert g.coords[3] == (1.0, 1.0)


def test_loads_all_nodes(sample_data):
    g = Graph.load(*sample_data)
    assert len(g.coords) == 3


def test_loads_edges(sample_data):
    g = Graph.load(*sample_data)
    assert (2, 10.0) in g.adjacency[1]
    assert (3, 5.0) in g.adjacency[2]


def test_node_with_no_outgoing_edges(sample_data):
    g = Graph.load(*sample_data)
    assert g.adjacency[3] == []
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_graph.py -v
```

Expected: `ModuleNotFoundError: No module named 'graph'`

- [ ] **Step 3: Implement backend/graph.py**

```python
import json


class Graph:
    def __init__(self):
        self.adjacency: dict[int, list[tuple[int, float]]] = {}
        self.coords: dict[int, tuple[float, float]] = {}

    @classmethod
    def load(cls, nodes_path: str, edges_path: str) -> "Graph":
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

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_graph.py -v
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add tests/test_graph.py backend/graph.py
git commit -m "feat: graph loader with TDD"
```

---

## Task 4: BFS and DFS (TDD)

**Files:**
- Create: `tests/test_algorithms.py`
- Create: `backend/algorithms.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_algorithms.py`:

```python
import pytest
from graph import Graph
from algorithms import bfs, dfs, reconstruct_path, compute_length


@pytest.fixture
def g():
    """
    1 --5-- 2 --3-- 3
            |
            7
            |
            4 --2-- 5
    Shortest path 1→5: [1,2,4,5], weight=14
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


class TestHelpers:
    def test_reconstruct_path(self):
        parent = {1: None, 2: 1, 3: 2}
        assert reconstruct_path(parent, 1, 3) == [1, 2, 3]

    def test_reconstruct_path_unreachable(self):
        parent = {1: None}
        assert reconstruct_path(parent, 1, 5) == []

    def test_compute_length(self, g):
        assert compute_length(g, [1, 2, 4, 5]) == 14.0

    def test_compute_length_single_node(self, g):
        assert compute_length(g, [1]) == 0.0

    def test_compute_length_empty(self, g):
        assert compute_length(g, []) is None


class TestBFS:
    def test_finds_path(self, g):
        result = bfs(g, 1, 5)
        assert result["path"] == [1, 2, 4, 5]

    def test_explored_contains_start(self, g):
        result = bfs(g, 1, 5)
        assert result["explored"][0] == 1

    def test_path_length(self, g):
        result = bfs(g, 1, 5)
        assert result["length_m"] == 14.0

    def test_no_path_returns_empty(self, g):
        result = bfs(g, 3, 5)
        assert result["path"] == []
        assert result["length_m"] is None

    def test_start_equals_end(self, g):
        result = bfs(g, 1, 1)
        assert result["path"] == [1]

    def test_has_time_ms(self, g):
        result = bfs(g, 1, 5)
        assert isinstance(result["time_ms"], float)
        assert result["time_ms"] >= 0


class TestDFS:
    def test_finds_path(self, g):
        result = dfs(g, 1, 5)
        assert result["path"][0] == 1
        assert result["path"][-1] == 5

    def test_explored_contains_start(self, g):
        result = dfs(g, 1, 5)
        assert 1 in result["explored"]

    def test_no_path_returns_empty(self, g):
        result = dfs(g, 3, 5)
        assert result["path"] == []
        assert result["length_m"] is None

    def test_has_time_ms(self, g):
        result = dfs(g, 1, 5)
        assert isinstance(result["time_ms"], float)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_algorithms.py -v
```

Expected: `ModuleNotFoundError: No module named 'algorithms'`

- [ ] **Step 3: Implement BFS, DFS, and helpers in backend/algorithms.py**

```python
import heapq
import math
import time
from collections import deque

from graph import Graph


# ── Helpers ──────────────────────────────────────────────────────────────────

def reconstruct_path(parent: dict, start: int, end: int) -> list[int]:
    if end not in parent:
        return []
    path = []
    node = end
    while node is not None:
        path.append(node)
        node = parent[node]
    return list(reversed(path))


def compute_length(graph: Graph, path: list[int]) -> float | None:
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
    """Straight-line distance in metres between two (lat, lng) points."""
    lat1, lng1 = pos1
    lat2, lng2 = pos2
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _result(explored, path, length_m, start_time) -> dict:
    return {
        "explored": explored,
        "path": path,
        "length_m": length_m,
        "time_ms": round((time.time() - start_time) * 1000, 2),
    }


# ── Algorithms ────────────────────────────────────────────────────────────────

def bfs(graph: Graph, start: int, end: int) -> dict:
    t0 = time.time()
    queue = deque([start])
    visited = {start}
    parent = {start: None}
    explored = []

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

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_algorithms.py::TestHelpers tests/test_algorithms.py::TestBFS tests/test_algorithms.py::TestDFS -v
```

Expected: all TestHelpers, TestBFS, TestDFS tests pass. TestDijkstra/TestAStar will error (not yet imported).

- [ ] **Step 5: Commit**

```bash
git add tests/test_algorithms.py backend/algorithms.py
git commit -m "feat: BFS, DFS, and path helpers with TDD"
```

---

## Task 5: Dijkstra and A* (TDD)

**Files:**
- Modify: `tests/test_algorithms.py` (add TestDijkstra + TestAStar classes)
- Modify: `backend/algorithms.py` (add dijkstra + astar functions)

- [ ] **Step 1: Add Dijkstra and A* tests to tests/test_algorithms.py**

First, update the import at the top of `tests/test_algorithms.py` — replace the existing `from algorithms import ...` line with:

```python
from algorithms import bfs, dfs, dijkstra, astar, reconstruct_path, compute_length
```

Then append these two classes to the end of the file:


class TestDijkstra:
    def test_finds_shortest_path(self, g):
        result = dijkstra(g, 1, 5)
        assert result["path"] == [1, 2, 4, 5]
        assert result["length_m"] == 14.0

    def test_explored_starts_at_start(self, g):
        result = dijkstra(g, 1, 5)
        assert result["explored"][0] == 1

    def test_no_path_returns_empty(self, g):
        result = dijkstra(g, 3, 5)
        assert result["path"] == []
        assert result["length_m"] is None

    def test_has_time_ms(self, g):
        result = dijkstra(g, 1, 5)
        assert isinstance(result["time_ms"], float)


class TestAStar:
    def test_finds_shortest_path(self, g):
        result = astar(g, 1, 5)
        assert result["path"] == [1, 2, 4, 5]
        assert result["length_m"] == 14.0

    def test_no_path_returns_empty(self, g):
        result = astar(g, 3, 5)
        assert result["path"] == []
        assert result["length_m"] is None

    def test_has_time_ms(self, g):
        result = astar(g, 1, 5)
        assert isinstance(result["time_ms"], float)
```

- [ ] **Step 2: Run tests to verify new ones fail**

```bash
pytest tests/test_algorithms.py::TestDijkstra tests/test_algorithms.py::TestAStar -v
```

Expected: `ImportError: cannot import name 'dijkstra'`

- [ ] **Step 3: Append dijkstra and astar to backend/algorithms.py**

```python
def dijkstra(graph: Graph, start: int, end: int) -> dict:
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
    t0 = time.time()
    end_pos = graph.coords[end]

    def h(node: int) -> float:
        return haversine(graph.coords[node], end_pos)

    heap = [(h(start), 0.0, start)]
    g_cost = {start: 0.0}
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
                heapq.heappush(heap, (new_g + h(neighbor), new_g, neighbor))

    path = reconstruct_path(parent, start, end)
    length_m = g_cost.get(end) if path else None
    return _result(explored, path, length_m, t0)
```

- [ ] **Step 4: Run all algorithm tests**

```bash
pytest tests/test_algorithms.py -v
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/test_algorithms.py backend/algorithms.py
git commit -m "feat: Dijkstra and A* with TDD"
```

---

## Task 6: FastAPI App (TDD)

**Files:**
- Create: `tests/test_api.py`
- Create: `backend/main.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_api.py`:

```python
import json
import os
import pytest

os.environ["TESTING"] = "1"  # Must be set before importing main

from fastapi.testclient import TestClient
import main
from graph import Graph

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
    main.graph = Graph.load(str(nodes_path), str(edges_path))
    with TestClient(main.app) as c:
        yield c


def test_get_nodes_returns_all(client):
    response = client.get("/nodes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    assert all("id" in n and "lat" in n and "lng" in n for n in data)


def test_pathfind_returns_all_algorithms(client):
    response = client.post("/pathfind", json={"start_node": 1, "end_node": 5})
    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"bfs", "dfs", "dijkstra", "astar"}


def test_pathfind_dijkstra_optimal_path(client):
    response = client.post("/pathfind", json={"start_node": 1, "end_node": 5})
    data = response.json()
    assert data["dijkstra"]["path"] == [1, 2, 4, 5]
    assert data["dijkstra"]["length_m"] == 14.0


def test_pathfind_result_has_required_fields(client):
    response = client.post("/pathfind", json={"start_node": 1, "end_node": 5})
    data = response.json()
    for alg in ["bfs", "dfs", "dijkstra", "astar"]:
        assert "explored" in data[alg]
        assert "path" in data[alg]
        assert "length_m" in data[alg]
        assert "time_ms" in data[alg]


def test_pathfind_unknown_start_node(client):
    response = client.post("/pathfind", json={"start_node": 9999, "end_node": 5})
    assert response.status_code == 404


def test_pathfind_unknown_end_node(client):
    response = client.post("/pathfind", json={"start_node": 1, "end_node": 9999})
    assert response.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_api.py -v
```

Expected: `ModuleNotFoundError: No module named 'main'`

- [ ] **Step 3: Create backend/main.py**

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

DATA_DIR = Path(__file__).parent.parent / "data"
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"

graph: Graph = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global graph
    if not os.getenv("TESTING"):
        graph = Graph.load(
            str(DATA_DIR / "nodes.json"),
            str(DATA_DIR / "edges.json"),
        )
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PathfindRequest(BaseModel):
    start_node: int
    end_node: int


@app.get("/nodes")
def get_nodes():
    return [
        {"id": nid, "lat": lat, "lng": lng}
        for nid, (lat, lng) in graph.coords.items()
    ]


@app.post("/pathfind")
def pathfind(req: PathfindRequest):
    if req.start_node not in graph.coords:
        raise HTTPException(status_code=404, detail=f"Start node {req.start_node} not found")
    if req.end_node not in graph.coords:
        raise HTTPException(status_code=404, detail=f"End node {req.end_node} not found")
    return {
        "bfs": bfs(graph, req.start_node, req.end_node),
        "dfs": dfs(graph, req.start_node, req.end_node),
        "dijkstra": dijkstra(graph, req.start_node, req.end_node),
        "astar": astar(graph, req.start_node, req.end_node),
    }


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
```

- [ ] **Step 4: Run all tests**

```bash
pytest tests/ -v
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/test_api.py backend/main.py
git commit -m "feat: FastAPI app with /nodes + /pathfind endpoints"
```

---

## Task 7: Frontend HTML + CSS

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/style.css`

- [ ] **Step 1: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PathFinder AI — Hà Đông</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <nav class="navbar">
    <span class="brand">PathFinder AI</span>
    <span class="nav-sub">PTIT · Hà Đông · Hà Nội</span>
  </nav>

  <div class="layout">
    <aside class="panel">

      <div class="panel-section">
        <span class="label">Start Point</span>
        <div id="start-info" class="coord-display">Click on map to set...</div>
      </div>

      <div class="panel-section">
        <span class="label">End Point</span>
        <div id="end-info" class="coord-display">Click on map to set...</div>
      </div>

      <div class="panel-section">
        <span class="label">Animation Speed</span>
        <input id="speed-slider" type="range" min="50" max="500" value="100" step="50" />
        <div class="slider-labels"><span>Fast</span><span>Slow</span></div>
      </div>

      <button id="btn-run" class="btn-primary" disabled>&#9654; Run All Algorithms</button>
      <button id="btn-clear" class="btn-secondary">&#10005; Clear</button>

      <hr class="divider" />

      <span class="label">Results</span>

      <div class="stat-card" id="card-bfs">
        <div class="stat-title bfs-text">BFS</div>
        <div class="stat-row">Explored: <span id="bfs-explored">&#8212;</span></div>
        <div class="stat-row">Length: <span id="bfs-length">&#8212;</span></div>
        <div class="stat-row">Time: <span id="bfs-time">&#8212;</span></div>
      </div>

      <div class="stat-card" id="card-dfs">
        <div class="stat-title dfs-text">DFS</div>
        <div class="stat-row">Explored: <span id="dfs-explored">&#8212;</span></div>
        <div class="stat-row">Length: <span id="dfs-length">&#8212;</span></div>
        <div class="stat-row">Time: <span id="dfs-time">&#8212;</span></div>
      </div>

      <div class="stat-card" id="card-dijkstra">
        <div class="stat-title dijkstra-text">Dijkstra</div>
        <div class="stat-row">Explored: <span id="dijkstra-explored">&#8212;</span></div>
        <div class="stat-row">Length: <span id="dijkstra-length">&#8212;</span></div>
        <div class="stat-row">Time: <span id="dijkstra-time">&#8212;</span></div>
      </div>

      <div class="stat-card" id="card-astar">
        <div class="stat-title astar-text">A*</div>
        <div class="stat-row">Explored: <span id="astar-explored">&#8212;</span></div>
        <div class="stat-row">Length: <span id="astar-length">&#8212;</span></div>
        <div class="stat-row">Time: <span id="astar-time">&#8212;</span></div>
      </div>

    </aside>

    <main id="map"></main>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create frontend/style.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-dark:   #1a1a2e;
  --bg-mid:    #16213e;
  --bg-light:  #0f3460;
  --accent:    #e94560;
  --text:      #eeeeee;
  --muted:     #aaaaaa;
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

/* Navbar */
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

/* Layout */
.layout { display: flex; flex: 1; overflow: hidden; }

/* Left panel */
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

/* Speed slider */
#speed-slider { width: 100%; accent-color: var(--accent); cursor: pointer; margin-top: 2px; }
.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--muted);
}

/* Buttons */
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

/* Stat cards */
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

/* Map */
#map { flex: 1; }
```

- [ ] **Step 3: Verify the page renders (no JS yet)**

```bash
cd backend && python -m uvicorn main:app --reload
```

Open http://localhost:8000 — should show the dark navbar + left panel + blank map area.

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/style.css
git commit -m "feat: frontend HTML shell and dark CSS theme"
```

---

## Task 8: Frontend JS — Initialization and Node Snapping

**Files:**
- Create: `frontend/app.js`

- [ ] **Step 1: Create frontend/app.js with map init, node fetch, and helpers**

```js
// ── Constants ─────────────────────────────────────────────────────────────────
const PTIT_CENTER = [20.9731, 105.7789];
const COLORS = { bfs: '#4ecdc4', dfs: '#ff6b6b', dijkstra: '#ffd166', astar: '#06d6a0' };
const ALGS = ['bfs', 'dfs', 'dijkstra', 'astar'];

// ── State ─────────────────────────────────────────────────────────────────────
let graphNodes = [];    // [{id, lat, lng}, ...]
let state = 0;          // 0=await start, 1=await end, 2=ran/running
let startNode = null;
let endNode = null;
let animationId = null;

// ── Map setup ─────────────────────────────────────────────────────────────────
const map = L.map('map').setView(PTIT_CENTER, 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);

// ── Layers ────────────────────────────────────────────────────────────────────
const markerLayer = L.layerGroup().addTo(map);
const exploredLayers = {};
const pathLayers = {};
for (const alg of ALGS) {
  exploredLayers[alg] = L.layerGroup().addTo(map);
  pathLayers[alg]     = L.layerGroup().addTo(map);
}

// ── Node data ─────────────────────────────────────────────────────────────────
fetch('/nodes')
  .then(r => r.json())
  .then(nodes => { graphNodes = nodes; })
  .catch(err => console.error('Failed to load nodes:', err));

// ── Helpers ───────────────────────────────────────────────────────────────────
function snapToNearestNode(lat, lng) {
  let nearest = null, minDist = Infinity;
  for (const node of graphNodes) {
    const d = Math.hypot(node.lat - lat, node.lng - lng);
    if (d < minDist) { minDist = d; nearest = node; }
  }
  return nearest;
}

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

- [ ] **Step 2: Start the server and verify map loads**

```bash
cd backend && python -m uvicorn main:app --reload
```

Open http://localhost:8000 — should show the Leaflet map of Hà Đông (OpenStreetMap tiles).
Open browser devtools → Network tab → verify `/nodes` returns a JSON array of objects with `id`, `lat`, `lng`.

- [ ] **Step 3: Commit**

```bash
git add frontend/app.js
git commit -m "feat: map init, node fetch, snap helper"
```

---

## Task 9: Frontend JS — Click State Machine and Pathfind Request

**Files:**
- Modify: `frontend/app.js` (append to existing file)

- [ ] **Step 1: Append click handler and button handlers to frontend/app.js**

```js
// ── Markers ───────────────────────────────────────────────────────────────────
function makeMarker(node, label, color) {
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

// ── Click handler ─────────────────────────────────────────────────────────────
map.on('click', (e) => {
  const node = snapToNearestNode(e.latlng.lat, e.latlng.lng);
  if (!node) return;

  if (state === 0) {
    markerLayer.clearLayers();
    clearResults();
    startNode = node;
    makeMarker(node, 'S', '#e94560').addTo(markerLayer);
    document.getElementById('start-info').textContent =
      `${node.lat.toFixed(5)}, ${node.lng.toFixed(5)}`;
    document.getElementById('end-info').textContent = 'Click on map to set...';
    endNode = null;
    document.getElementById('btn-run').disabled = true;
    state = 1;

  } else if (state === 1) {
    endNode = node;
    makeMarker(node, 'E', '#06d6a0').addTo(markerLayer);
    document.getElementById('end-info').textContent =
      `${node.lat.toFixed(5)}, ${node.lng.toFixed(5)}`;
    document.getElementById('btn-run').disabled = false;
    state = 2;

  } else {
    // Reset: next click will set new start
    state = 0;
    startNode = null;
    endNode = null;
    markerLayer.clearLayers();
    clearResults();
    document.getElementById('start-info').textContent = 'Click on map to set...';
    document.getElementById('end-info').textContent   = 'Click on map to set...';
    document.getElementById('btn-run').disabled = true;
  }
});

// ── Clear button ──────────────────────────────────────────────────────────────
document.getElementById('btn-clear').addEventListener('click', () => {
  state = 0;
  startNode = null;
  endNode = null;
  markerLayer.clearLayers();
  clearResults();
  document.getElementById('start-info').textContent = 'Click on map to set...';
  document.getElementById('end-info').textContent   = 'Click on map to set...';
  document.getElementById('btn-run').disabled = true;
});

// ── Run button ────────────────────────────────────────────────────────────────
document.getElementById('btn-run').addEventListener('click', async () => {
  const btn = document.getElementById('btn-run');
  btn.disabled = true;
  btn.textContent = 'Running...';
  clearResults();

  try {
    const res = await fetch('/pathfind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_node: startNode.id, end_node: endNode.id }),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const results = await res.json();
    startAnimation(results);
  } catch (err) {
    console.error('Pathfind failed:', err);
    alert('Pathfinding failed. Check the console for details.');
  } finally {
    btn.textContent = '▶ Run All Algorithms';
    btn.disabled = false;
  }
});
```

- [ ] **Step 2: Test the interaction manually**

Start the server and open http://localhost:8000.
- Click once on the map → red **S** marker appears, start coords shown in panel
- Click again → green **E** marker appears, "Run All Algorithms" button activates
- Click a third time → everything resets
- Click "Clear" → everything resets

- [ ] **Step 3: Commit**

```bash
git add frontend/app.js
git commit -m "feat: click state machine and pathfind request"
```

---

## Task 10: Frontend JS — Animation, Final Paths, and Stats

**Files:**
- Modify: `frontend/app.js` (append to existing file)

- [ ] **Step 1: Append animation functions to frontend/app.js**

```js
// ── Animation ─────────────────────────────────────────────────────────────────
function startAnimation(results) {
  const nodeMap = {};
  for (const node of graphNodes) nodeMap[node.id] = node;

  const BATCH = 10;
  const indices = { bfs: 0, dfs: 0, dijkstra: 0, astar: 0 };
  let lastSpeed = parseInt(document.getElementById('speed-slider').value);

  function tick() {
    let allDone = true;

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

    if (allDone) {
      clearInterval(animationId);
      animationId = null;
      drawFinalPaths(results, nodeMap);
      updateStats(results);
      return;
    }

    // Dynamically update speed from slider
    const newSpeed = parseInt(document.getElementById('speed-slider').value);
    if (newSpeed !== lastSpeed) {
      clearInterval(animationId);
      lastSpeed = newSpeed;
      animationId = setInterval(tick, lastSpeed);
    }
  }

  animationId = setInterval(tick, lastSpeed);
}

// ── Draw final paths ──────────────────────────────────────────────────────────
function drawFinalPaths(results, nodeMap) {
  const allLatLngs = [];

  for (const alg of ALGS) {
    // Fade explored nodes
    exploredLayers[alg].eachLayer(layer => {
      if (layer.setStyle) layer.setStyle({ fillOpacity: 0.15, opacity: 0 });
    });

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

  if (allLatLngs.length > 0) {
    map.fitBounds(L.latLngBounds(allLatLngs).pad(0.15));
  }
}

// ── Stats panel ───────────────────────────────────────────────────────────────
function updateStats(results) {
  for (const alg of ALGS) {
    const r = results[alg];
    document.getElementById(`${alg}-explored`).textContent =
      r.explored.length.toLocaleString();
    document.getElementById(`${alg}-length`).textContent =
      r.length_m !== null ? `${(r.length_m / 1000).toFixed(2)} km` : 'N/A';
    document.getElementById(`${alg}-time`).textContent =
      `${r.time_ms} ms`;
  }
}
```

- [ ] **Step 2: Test the full flow manually**

Open http://localhost:8000.
- Click start point → click end point → click "Run All Algorithms"
- Verify: colored dots fan out from start across the map simultaneously for all 4 algorithms
- Verify: when animation ends, bold colored paths are drawn and stats panel fills in
- Verify: speed slider changes animation speed mid-run
- Verify: map auto-fits to show all 4 paths after animation ends

- [ ] **Step 3: Commit**

```bash
git add frontend/app.js
git commit -m "feat: animation, final path drawing, stats panel"
```

---

## Task 11: End-to-End Smoke Test

- [ ] **Step 1: Run the full test suite**

```bash
pytest tests/ -v
```

Expected: all tests pass.

- [ ] **Step 2: Start the server**

```bash
cd backend && python -m uvicorn main:app --reload --port 8000
```

- [ ] **Step 3: Verify full flow on the real map**

Open http://localhost:8000.

Checklist:
- [ ] Map loads centered on PTIT campus (Hà Đông area visible)
- [ ] Clicking map places S marker (snapped to road node)
- [ ] Second click places E marker, Run button activates
- [ ] "Run All Algorithms" sends POST to `/pathfind` (visible in Network tab)
- [ ] All 4 algorithm exploration animations play in their colors
- [ ] Final paths drawn as bold polylines after animation
- [ ] Stats panel shows nodes explored / km / ms for each algorithm
- [ ] A* explores fewer nodes than BFS and Dijkstra (expected on real map)
- [ ] Clear button resets everything

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete pathfinding visualization app"
```
