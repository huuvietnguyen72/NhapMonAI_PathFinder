# Pathfinding Visualization Web App — Design Spec

**Date:** 2026-04-29  
**Project:** Introduction to Artificial Intelligence — PTIT, Vietnam  
**Map area:** Hà Đông district, near PTIT campus, Hanoi  

---

## 1. Overview

A web application that lets users pick two points on a real map of Hà Đông district and watch BFS, DFS, Dijkstra, and A* search for the shortest path simultaneously — with animated step-by-step exploration followed by final path highlighting and per-algorithm statistics.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.x + FastAPI |
| Frontend | HTML + CSS + Vanilla JavaScript |
| Map rendering | Leaflet.js (OpenStreetMap tiles) |
| Map data export | osmnx (one-time export) |
| Data format | JSON (`nodes.json`, `edges.json`) |

---

## 3. Architecture

```
osmnx (one-time)
    │
    ▼
nodes.json / edges.json
    │
    ▼
FastAPI backend  ←──── POST /pathfind ────►  Frontend JS  ──►  Leaflet map
 (loads graph              {start_node,        (animates
  at startup,               end_node}           exploration,
  runs algorithms)                              draws paths,
                      ◄────────────────────     shows stats)
                        {bfs, dfs, dijkstra,
                         astar results}
```

**Key principle:** Python does the algorithmic work; JavaScript handles all rendering and animation. The backend is stateless — every `/pathfind` call is independent.

---

## 4. File Structure

```
NhapMon_AI/
├── backend/
│   ├── main.py          ← FastAPI app entry point, loads graph, registers routes
│   ├── algorithms.py    ← BFS, DFS, Dijkstra, A* implementations
│   ├── graph.py         ← Graph loader: parses nodes.json + edges.json into adjacency structure
│   └── data_export.py   ← One-time script: uses osmnx to export Hà Đông graph to data/
├── data/
│   ├── nodes.json       ← Array of {id, lat, lng} for each road intersection node
│   └── edges.json       ← Array of {from, to, weight_m} for each directed road segment
└── frontend/
    ├── index.html       ← Single-page app shell
    ├── style.css        ← Dark theme (navy/teal/red palette)
    └── app.js           ← Leaflet map init, click handlers, node snapping, fetch, animation
```

---

## 5. Data Format

### nodes.json
```json
[
  { "id": 12345678, "lat": 20.9710, "lng": 105.7769 },
  ...
]
```

### edges.json
```json
[
  { "from": 12345678, "to": 87654321, "weight_m": 145.2 },
  ...
]
```

`weight_m` is the road segment length in metres, derived from osmnx geometry. The graph is directed (one-way streets respected).

---

## 6. API

### `GET /nodes`
Returns the full `nodes.json` array. Called once at page load by the frontend to populate the snapping lookup.

### `POST /pathfind`

**Request:**
```json
{ "start_node": 12345678, "end_node": 87654321 }
```

**Response:**
```json
{
  "bfs":      { "explored": [id, ...], "path": [id, ...], "length_m": 2400, "time_ms": 18 },
  "dfs":      { "explored": [id, ...], "path": [id, ...], "length_m": 4100, "time_ms": 22 },
  "dijkstra": { "explored": [id, ...], "path": [id, ...], "length_m": 2100, "time_ms": 14 },
  "astar":    { "explored": [id, ...], "path": [id, ...], "length_m": 2100, "time_ms": 8  }
}
```

- `explored`: ordered list of node IDs visited during search — drives the animation
- `path`: final shortest-path node IDs from start to end
- `length_m`: total path distance in metres
- `time_ms`: server-side algorithm wall-clock time in milliseconds
- If no path exists, `path` is `[]` and `length_m` is `null`

**Error responses:**
- `404` if start or end node ID is not in the graph
- `422` for malformed request body (FastAPI default)

---

## 7. Backend Design

### `graph.py`
- Loads `nodes.json` and `edges.json` once at startup
- Builds an adjacency dict: `{node_id: [(neighbor_id, weight_m), ...]}`
- Also builds a `{node_id: (lat, lng)}` lookup for A* heuristic

### `algorithms.py`
Each function signature:
```python
def bfs(graph, start, end) -> dict:
    # returns {"explored": [...], "path": [...], "length_m": float, "time_ms": float}
```

- **BFS**: queue-based, unweighted — finds path with fewest hops
- **DFS**: stack-based, unweighted — no shortest-path guarantee
- **Dijkstra**: min-heap priority queue on cumulative `weight_m`
- **A\***: Dijkstra + haversine heuristic (straight-line distance to goal in metres)

All four record the order nodes are popped from their frontier into `explored`.

### `main.py`
- FastAPI app with CORS enabled (allows `localhost` frontend)
- Loads graph via `graph.py` at startup using `@app.on_event("startup")`
- `POST /pathfind` runs all 4 algorithms and returns combined response
- Serves `frontend/` as static files so the app works from a single `uvicorn` process

---

## 8. Frontend Design

### `app.js` — core responsibilities

**1. Initialization**
- Init Leaflet map centered on PTIT campus (~20.9731° N, 105.7789° E), zoom 15
- Fetch `GET /nodes`, store array in memory for snapping

**2. Node snapping**
```js
function snapToNearestNode(clickLat, clickLng) {
  let nearest = null, minDist = Infinity;
  for (const node of graphNodes) {
    const d = Math.hypot(node.lat - clickLat, node.lng - clickLng);
    if (d < minDist) { minDist = d; nearest = node; }
  }
  return nearest;
}
```
O(n) — acceptable for ~5,000–15,000 nodes in Hà Đông.

**3. Click state machine**
- State 0 → click → place S marker, show coords, advance to state 1
- State 1 → click → place E marker, show coords, enable Run button, advance to state 2
- Any click in state 2 (after run) resets to state 0

**4. Animation**
- On "Run All Algorithms": POST `/pathfind`, receive results
- Use `setInterval` (tick rate from speed slider, 50ms–500ms) to advance all 4 algorithms in lockstep
- Each tick: render next **10 explored nodes** per algorithm as small `L.circleMarker` on per-algorithm Leaflet layer
- When all 4 finish exploring: clear explored layers (or fade opacity to 0.15), draw final paths as `L.polyline` per algorithm, fill stats panel

**5. Layers**
- One `L.layerGroup` per algorithm (4 groups for explored nodes, 4 for final paths)
- Start/end markers on a separate layer
- All layers cleared on reset

### `style.css`
Dark navy theme:
- Background: `#1a1a2e` / `#16213e` / `#0f3460`
- Accent: `#e94560` (red), per-algorithm colors as above
- Font: system sans-serif stack

---

## 9. User Interaction Flow

1. Page loads → map centers on PTIT campus → nodes fetched silently in background
2. **First click** on map → snapped to nearest node → red **S** marker placed → left panel shows start coordinates
3. **Second click** on map → snapped to nearest node → green **E** marker placed → "Run All Algorithms" button activates
4. **Click "Run All Algorithms"** → button shows loading state → `POST /pathfind` → animation begins
5. **Animation** → all 4 algorithms animate simultaneously in their colors; speed slider adjustable mid-animation
6. **Animation ends** → explored dots fade → bold final paths drawn → stats panel fills with nodes explored / path length / time for each algorithm
7. **Click "Clear"** or click map again → all layers cleared, resets to initial state (ready for new start/end selection)

---

## 10. Color Scheme

| Algorithm | Color | Hex |
|---|---|---|
| BFS | Teal | `#4ecdc4` |
| DFS | Red-orange | `#ff6b6b` |
| Dijkstra | Yellow | `#ffd166` |
| A* | Green | `#06d6a0` |

---

## 11. Out of Scope

- User accounts or saved routes
- Mobile responsiveness (desktop demo only)
- Real-time osmnx queries (graph is pre-exported)
- Turn-by-turn directions or street names
- Geocoding / address search
