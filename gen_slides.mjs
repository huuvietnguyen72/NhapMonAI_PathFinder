import PptxGenJS from 'pptxgenjs';

const prs = new PptxGenJS();
prs.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 inches

// ─── Theme ───────────────────────────────────────────────────────────────────
const BG1    = '0f0c29';
const BG2    = '1e1b4b';
const BG3    = '312e81';
const GLASS  = '1c1945';
const GLASBD = '363780';
const ACC1   = '818cf8';
const ACC2   = '34d399';
const WHITE  = 'e0e7ff';
const MUTED  = '6b7ab8';
const LAVNDR = 'a5b4fc';
const BFS_C  = '4ecdc4';
const DFS_C  = 'ff6b6b';
const DIJ_C  = 'ffd166';
const AST_C  = '06d6a0';

function newSlide() {
  const s = prs.addSlide();
  s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: BG1 }, line: { color: BG1 } });
  s.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 4.5, fill: { color: BG2, transparency: 30 }, line: { color: BG2, transparency: 30 } });
  s.addShape(prs.ShapeType.rect, { x: 6, y: 0, w: 7.33, h: 7.5, fill: { color: BG3, transparency: 50 }, line: { color: BG3, transparency: 50 } });
  s.addShape(prs.ShapeType.rect, { x: 0, y: 0,    w: 0.06, h: 3.75, fill: { color: ACC1 }, line: { color: ACC1 } });
  s.addShape(prs.ShapeType.rect, { x: 0, y: 3.75, w: 0.06, h: 3.75, fill: { color: ACC2 }, line: { color: ACC2 } });
  return s;
}

function addTitle(s, text, color = WHITE) {
  s.addText(text, {
    x: 0.4, y: 0.3, w: 12.5, h: 0.6,
    fontSize: 26, bold: true, color, fontFace: 'Calibri', align: 'left',
  });
}

function addTitleBar(s, color = ACC1) {
  s.addShape(prs.ShapeType.rect, { x: 0.4, y: 0.95, w: 12.5, h: 0.03, fill: { color }, line: { color } });
}

function glassCard(s, x, y, w, h, borderColor = GLASBD) {
  s.addShape(prs.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: GLASS },
    line: { color: borderColor, width: 1.2 },
  });
}

function txt(s, text, x, y, w, h, opts = {}) {
  s.addText(text, {
    x, y, w, h, fontFace: 'Calibri', color: WHITE, fontSize: 16,
    ...opts,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Trang bìa
// ════════════════════════════════════════════════════════════════════════════
{
  const s = newSlide();

  // Glow tím góc phải trên
  s.addShape(prs.ShapeType.ellipse, {
    x: 9.5, y: -1.2, w: 5, h: 5,
    fill: { color: ACC1, transparency: 82 }, line: { color: ACC1, transparency: 82 },
  });
  // Glow xanh góc trái dưới
  s.addShape(prs.ShapeType.ellipse, {
    x: -1, y: 4.5, w: 4, h: 4,
    fill: { color: ACC2, transparency: 85 }, line: { color: ACC2, transparency: 85 },
  });

  // Icon card bên trái
  glassCard(s, 0.8, 1.8, 3.0, 3.0, ACC1);
  s.addText('🗺️', { x: 0.8, y: 1.8, w: 3.0, h: 3.0, align: 'center', valign: 'middle', fontSize: 72 });

  // Tag
  s.addShape(prs.ShapeType.roundRect, {
    x: 4.3, y: 1.85, w: 3.2, h: 0.38, rectRadius: 0.15,
    fill: { color: ACC1, transparency: 85 }, line: { color: ACC1, transparency: 50 },
  });
  txt(s, 'Đồ án  ·  Nhập Môn TTNT', 4.3, 1.85, 3.2, 0.38, {
    fontSize: 11, color: LAVNDR, align: 'center', valign: 'middle', bold: true,
  });

  // Title
  txt(s, 'PathFinder AI', 4.3, 2.45, 8.7, 1.1, {
    fontSize: 52, bold: true, color: LAVNDR,
  });

  // Subtitle
  txt(s, 'Trực Quan Hóa Thuật Toán Tìm Đường', 4.3, 3.55, 8.7, 0.55, {
    fontSize: 22, bold: true, color: WHITE,
  });
  txt(s, 'trên Bản Đồ Thực Hà Đông, Hà Nội', 4.3, 4.08, 8.7, 0.45, {
    fontSize: 17, color: MUTED,
  });

  // Gạch ngăn
  s.addShape(prs.ShapeType.rect, { x: 4.3, y: 4.65, w: 8.7, h: 0.03, fill: { color: GLASBD }, line: { color: GLASBD } });

  // 4 algo chips
  const chips = [['BFS', BFS_C], ['DFS', DFS_C], ['Dijkstra', DIJ_C], ['A*', AST_C]];
  chips.forEach(([name, c], i) => {
    const cx = 4.3 + i * 1.85;
    s.addShape(prs.ShapeType.roundRect, {
      x: cx, y: 4.85, w: 1.65, h: 0.38, rectRadius: 0.05,
      fill: { color: c, transparency: 82 }, line: { color: c, transparency: 50 },
    });
    txt(s, name, cx, 4.85, 1.65, 0.38, { fontSize: 12, bold: true, color: c, align: 'center', valign: 'middle' });
  });

  // Meta
  txt(s, 'Học viện Công nghệ Bưu chính Viễn thông (PTIT)', 4.3, 5.55, 8.7, 0.4, { fontSize: 14, color: MUTED });
  txt(s, 'Hà Nội – 2025', 4.3, 5.95, 8.7, 0.35, { fontSize: 13, color: MUTED, italic: true });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Mục lục
// ════════════════════════════════════════════════════════════════════════════
{
  const s = newSlide();
  addTitle(s, 'Nội Dung Trình Bày', LAVNDR);
  addTitleBar(s, ACC1);

  const items = [
    ['01', 'Giới thiệu đề tài',       BFS_C],
    ['02', 'Kiến trúc hệ thống',      DIJ_C],
    ['03', 'Thuật toán BFS & DFS',    DFS_C],
    ['04', 'Thuật toán Dijkstra & A*', AST_C],
    ['05', 'Giao diện & Demo',        ACC1],
    ['06', 'Kết quả so sánh',         ACC2],
    ['07', 'Kiểm thử & Kết luận',     MUTED],
  ];

  const cardW = 5.8, cardH = 0.68, gapX = 0.8, gapY = 0.15, startX = 0.5, startY = 1.15;

  items.forEach(([num, title, color], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);
    glassCard(s, x, y, cardW, cardH, color);
    // Số badge
    s.addShape(prs.ShapeType.roundRect, {
      x: x + 0.06, y: y + 0.07, w: 0.54, h: cardH - 0.14, rectRadius: 0.05,
      fill: { color }, line: { color },
    });
    txt(s, num, x + 0.06, y + 0.07, 0.54, cardH - 0.14, {
      fontSize: 17, bold: true, color: BG1, align: 'center', valign: 'middle',
    });
    txt(s, title, x + 0.72, y, cardW - 0.78, cardH, {
      fontSize: 16, color: WHITE, valign: 'middle',
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Giới thiệu đề tài
// ════════════════════════════════════════════════════════════════════════════
{
  const s = newSlide();
  addTitle(s, '01. Giới Thiệu Đề Tài', BFS_C);
  addTitleBar(s, BFS_C);

  txt(s, 'Bài toán tìm đường là bài toán nền tảng trong Trí tuệ Nhân tạo. PathFinder AI áp dụng 4 thuật toán trực tiếp lên bản đồ đường bộ thực của Hà Đông — không phải đồ thị lý thuyết.', 0.4, 1.1, 12.5, 0.75, {
    fontSize: 15, color: MUTED, wrap: true,
  });

  const features = [
    ['🗺️', 'Bản đồ thực', '1 007 nút giao thông\n2 644 cạnh đường bộ\nHà Đông, Hà Nội'],
    ['⚡', 'Đồng thời',   'Chạy song song 4 thuật toán\nHoạt ảnh từng bước khám phá'],
    ['📊', 'So sánh',     'Số nút duyệt · Độ dài đường\nThời gian thực thi'],
    ['🎛️', 'Tương tác',  'Click chọn điểm · Điều chỉnh tốc độ\nẨn/hiện từng thuật toán'],
  ];

  features.forEach(([icon, title, desc], i) => {
    const x = 0.4 + i * 3.15;
    glassCard(s, x, 2.05, 3.0, 5.1);
    s.addText(icon, { x, y: 2.2, w: 3.0, h: 0.9, align: 'center', fontSize: 38 });
    txt(s, title, x, 3.2, 3.0, 0.5, { fontSize: 15, bold: true, color: ACC2, align: 'center' });
    txt(s, desc,  x, 3.75, 3.0, 3.2, { fontSize: 13, color: MUTED, align: 'center', wrap: true });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — Kiến trúc hệ thống
// ════════════════════════════════════════════════════════════════════════════
{
  const s = newSlide();
  addTitle(s, '02. Kiến Trúc Hệ Thống', DIJ_C);
  addTitleBar(s, DIJ_C);

  // Cột Frontend
  glassCard(s, 0.3, 1.15, 3.7, 5.9, BFS_C);
  txt(s, 'FRONTEND', 0.3, 1.15, 3.7, 0.55, { fontSize: 15, bold: true, color: BFS_C, align: 'center', valign: 'middle' });
  ['Vanilla JS', 'Leaflet.js 1.9.4', 'HTML / CSS', 'Dark theme UI', 'Hoạt ảnh đồng bộ'].forEach((t, i) => {
    txt(s, t, 0.5, 1.85 + i * 0.88, 3.3, 0.72, { fontSize: 14, color: WHITE, align: 'center', valign: 'middle' });
  });

  // Mũi tên REST API
  s.addShape(prs.ShapeType.rightArrow, { x: 4.15, y: 3.7, w: 1.0, h: 0.5, fill: { color: ACC2 }, line: { color: ACC2 } });
  txt(s, 'REST', 4.15, 4.25, 1.0, 0.3, { fontSize: 10, color: ACC2, align: 'center' });
  s.addShape(prs.ShapeType.leftArrow,  { x: 4.15, y: 3.1, w: 1.0, h: 0.5, fill: { color: MUTED }, line: { color: MUTED } });
  txt(s, 'JSON', 4.15, 2.75, 1.0, 0.3, { fontSize: 10, color: MUTED, align: 'center' });

  // Cột Backend
  glassCard(s, 5.3, 1.15, 3.7, 5.9, DIJ_C);
  txt(s, 'BACKEND', 5.3, 1.15, 3.7, 0.55, { fontSize: 15, bold: true, color: DIJ_C, align: 'center', valign: 'middle' });
  ['Python 3.x', 'FastAPI', 'uvicorn', 'BFS / DFS', 'Dijkstra / A*'].forEach((t, i) => {
    txt(s, t, 5.5, 1.85 + i * 0.88, 3.3, 0.72, { fontSize: 14, color: WHITE, align: 'center', valign: 'middle' });
  });

  // Mũi tên Data
  s.addShape(prs.ShapeType.rightArrow, { x: 9.15, y: 3.9, w: 0.7, h: 0.45, fill: { color: AST_C }, line: { color: AST_C } });

  // Cột Data
  glassCard(s, 9.95, 1.15, 3.05, 5.9, AST_C);
  txt(s, 'DỮ LIỆU', 9.95, 1.15, 3.05, 0.55, { fontSize: 15, bold: true, color: AST_C, align: 'center', valign: 'middle' });
  ['nodes.json', '1 007 nút', 'edges.json', '2 644 cạnh', 'osmnx export'].forEach((t, i) => {
    txt(s, t, 9.95, 1.85 + i * 0.88, 3.05, 0.72, { fontSize: 14, color: WHITE, align: 'center', valign: 'middle' });
  });
}

prs.writeFile({ fileName: 'ThuyetTrinh_PathFinderAI.pptx' })
  .then(() => console.log('OK: ThuyetTrinh_PathFinderAI.pptx'))
  .catch(err => { console.error(err); process.exit(1); });
