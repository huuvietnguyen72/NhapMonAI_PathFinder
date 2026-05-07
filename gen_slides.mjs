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
// SLIDES sẽ được thêm vào đây ở các task tiếp theo
// ════════════════════════════════════════════════════════════════════════════

prs.writeFile({ fileName: 'ThuyetTrinh_PathFinderAI.pptx' })
  .then(() => console.log('OK: ThuyetTrinh_PathFinderAI.pptx'))
  .catch(err => { console.error(err); process.exit(1); });
