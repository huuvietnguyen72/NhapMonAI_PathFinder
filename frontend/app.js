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

// ── Tạo marker điểm S/E trên bản đồ ─────────────────────────────────────────

function makeMarker(node, label, color) {
  // Marker dạng giọt nước với nhãn S hoặc E
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

// ── Xử lý sự kiện click trên bản đồ ─────────────────────────────────────────
//
// Máy trạng thái:
//   0 → click → đặt S → chuyển state 1
//   1 → click → đặt E → kích hoạt nút Run → chuyển state 2
//   2 → click → reset về state 0 (sẵn sàng chọn điểm mới)

map.on('click', (e) => {
  const node = snapToNearestNode(e.latlng.lat, e.latlng.lng);
  if (!node) return;

  if (state === 0) {
    // Chọn điểm bắt đầu
    markerLayer.clearLayers();
    clearResults();
    startNode = node;
    makeMarker(node, 'S', '#e94560').addTo(markerLayer);
    document.getElementById('start-info').textContent =
      `${node.lat.toFixed(5)}, ${node.lng.toFixed(5)}`;
    document.getElementById('end-info').textContent = 'Nhấp vào bản đồ để chọn...';
    endNode = null;
    document.getElementById('btn-run').disabled = true;
    state = 1;

  } else if (state === 1) {
    // Chọn điểm kết thúc
    endNode = node;
    makeMarker(node, 'E', '#06d6a0').addTo(markerLayer);
    document.getElementById('end-info').textContent =
      `${node.lat.toFixed(5)}, ${node.lng.toFixed(5)}`;
    document.getElementById('btn-run').disabled = false;
    state = 2;

  } else {
    // Reset — click lần 3 trở đi xóa tất cả
    state = 0;
    startNode = null;
    endNode = null;
    markerLayer.clearLayers();
    clearResults();
    document.getElementById('start-info').textContent = 'Nhấp vào bản đồ để chọn...';
    document.getElementById('end-info').textContent   = 'Nhấp vào bản đồ để chọn...';
    document.getElementById('btn-run').disabled = true;
  }
});

// ── Nút Xóa ──────────────────────────────────────────────────────────────────
document.getElementById('btn-clear').addEventListener('click', () => {
  state = 0;
  startNode = null;
  endNode = null;
  markerLayer.clearLayers();
  clearResults();
  document.getElementById('start-info').textContent = 'Nhấp vào bản đồ để chọn...';
  document.getElementById('end-info').textContent   = 'Nhấp vào bản đồ để chọn...';
  document.getElementById('btn-run').disabled = true;
});

// ── Nút Chạy Thuật Toán ───────────────────────────────────────────────────────
document.getElementById('btn-run').addEventListener('click', async () => {
  const btn = document.getElementById('btn-run');
  btn.disabled = true;
  btn.textContent = 'Đang chạy...';
  clearResults();

  try {
    const res = await fetch('/pathfind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_node: startNode.id, end_node: endNode.id }),
    });
    if (!res.ok) throw new Error(`Lỗi server: ${res.status}`);
    const results = await res.json();
    startAnimation(results); // Hàm này được định nghĩa ở Task 10
  } catch (err) {
    console.error('Tìm đường thất bại:', err);
    alert('Tìm đường thất bại. Kiểm tra console để xem chi tiết.');
  } finally {
    btn.textContent = '▶ Chạy Tất Cả Thuật Toán';
    btn.disabled = false;
  }
});
