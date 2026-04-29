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
