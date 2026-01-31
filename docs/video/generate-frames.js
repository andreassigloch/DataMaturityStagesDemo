#!/usr/bin/env node
/**
 * Frame Generator für Demo-Video
 *
 * Erstellt statische Frames aus Screenshots und Text,
 * die dann mit ffmpeg zu einem Video zusammengefügt werden.
 *
 * Usage: node generate-frames.js [2min|8min]
 *
 * Abhängigkeiten: npm install canvas
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

const SCRIPT_DIR = __dirname;
const FRAMES_DIR = path.join(SCRIPT_DIR, 'frames');
const OUTPUT_DIR = path.join(FRAMES_DIR, 'generated');

// Stelle sicher, dass Output-Verzeichnis existiert
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Farben
const COLORS = {
  background: '#1a1a2e',
  backgroundDark: '#0a0a14',
  backgroundWarning: '#2d1f1f',
  text: '#ffffff',
  accent: '#4ade80',
  warning: '#ff6b6b',
  muted: '#94a3b8'
};

// Canvas erstellen
function createFrame(width = 1920, height = 1080) {
  return createCanvas(width, height);
}

// Hintergrund füllen
function fillBackground(ctx, color = COLORS.background) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// Text zentriert zeichnen
function drawCenteredText(ctx, text, options = {}) {
  const {
    y = ctx.canvas.height / 2,
    fontSize = 64,
    color = COLORS.text,
    lineHeight = 1.4
  } = options;

  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = text.split('\n');
  const totalHeight = lines.length * fontSize * lineHeight;
  let startY = y - totalHeight / 2 + fontSize / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, ctx.canvas.width / 2, startY + i * fontSize * lineHeight);
  });
}

// Overlay-Bar zeichnen
function drawOverlayBar(ctx, text, position = 'bottom') {
  const barHeight = 80;
  const y = position === 'bottom' ? ctx.canvas.height - barHeight : 0;

  // Halbtransparenter Hintergrund
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, y, ctx.canvas.width, barHeight);

  // Text
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 36px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, ctx.canvas.width / 2, y + barHeight / 2);
}

// Kapitel-Header zeichnen
function drawChapterHeader(ctx, chapter, title) {
  fillBackground(ctx, COLORS.backgroundDark);

  // Kapitel-Nummer
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 32px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`KAPITEL ${chapter}`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);

  // Titel
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 72px Inter, Arial, sans-serif';
  ctx.fillText(title, ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);
}

// Frame speichern
function saveFrame(canvas, filename) {
  const buffer = canvas.toBuffer('image/png');
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`✅ ${filename}`);
}

// Bild laden und als Frame speichern
async function createFrameFromImage(imagePath, overlayText, outputFilename) {
  const canvas = createFrame();
  const ctx = canvas.getContext('2d');

  try {
    const img = await loadImage(imagePath);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (overlayText) {
      drawOverlayBar(ctx, overlayText);
    }

    saveFrame(canvas, outputFilename);
  } catch (err) {
    console.error(`⚠️ Bild nicht gefunden: ${imagePath}`);
    // Fallback: Text-Frame
    fillBackground(ctx);
    drawCenteredText(ctx, overlayText || 'Screenshot fehlt', { fontSize: 48 });
    saveFrame(canvas, outputFilename);
  }
}

// ============================================
// FRAME DEFINITIONEN
// ============================================

async function generate2MinFrames() {
  console.log('\n🎬 Generiere 2-Minuten Frames...\n');

  // Frame 1: Titel
  let canvas = createFrame();
  let ctx = canvas.getContext('2d');
  fillBackground(ctx);
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 28px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SIGLOCH CONSULTING', canvas.width / 2, canvas.height / 2 - 120);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 84px Inter, Arial, sans-serif';
  ctx.fillText('Requirements Traceability', canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '36px Inter, Arial, sans-serif';
  ctx.fillText('Von PDFs zu Wissen', canvas.width / 2, canvas.height / 2 + 80);
  saveFrame(canvas, '01-title.png');

  // Frame 2: Problem
  canvas = createFrame();
  ctx = canvas.getContext('2d');
  fillBackground(ctx);
  drawCenteredText(ctx, '4 Dokumente. 4 Formate.', { y: canvas.height / 2 - 40 });
  drawCenteredText(ctx, 'Keine Verbindung.', { y: canvas.height / 2 + 60, color: COLORS.warning });
  saveFrame(canvas, '02-problem.png');

  // Frame 3: RAG Limitation
  canvas = createFrame();
  ctx = canvas.getContext('2d');
  fillBackground(ctx);
  drawCenteredText(ctx, 'RAG findet Text...', { y: canvas.height / 2 - 40 });
  drawCenteredText(ctx, '...aber keine Beziehungen.', { y: canvas.height / 2 + 60, color: COLORS.warning });
  saveFrame(canvas, '03-rag-limit.png');

  // Frame 4: Knowledge Graph (Screenshot)
  await createFrameFromImage(
    path.join(FRAMES_DIR, '04-dashboard-overview.png'),
    'Knowledge Graph: Struktur statt Suche',
    '04-graph.png'
  );

  // Frame 5: Hierarchy
  canvas = createFrame();
  ctx = canvas.getContext('2d');
  fillBackground(ctx);
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 72px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STK → SYS → SW', canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillStyle = COLORS.text;
  ctx.font = '48px Inter, Arial, sans-serif';
  ctx.fillText('Vollständige Traceability', canvas.width / 2, canvas.height / 2 + 60);
  saveFrame(canvas, '05-hierarchy.png');

  // Frame 6: Rules (Screenshot)
  await createFrameFromImage(
    path.join(FRAMES_DIR, '07-dashboard-rules.png'),
    '5 Regeln: A-SPICE + ISO 26262',
    '06-rules.png'
  );

  // Frame 7: Violation
  canvas = createFrame();
  ctx = canvas.getContext('2d');
  fillBackground(ctx, COLORS.backgroundWarning);
  ctx.fillStyle = COLORS.warning;
  ctx.font = 'bold 64px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚠️ SW-003 hat KEINEN Test!', canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillStyle = COLORS.text;
  ctx.font = '42px Inter, Arial, sans-serif';
  ctx.fillText('Das wäre ein Audit-Finding.', canvas.width / 2, canvas.height / 2 + 60);
  saveFrame(canvas, '07-violation.png');

  // Frame 8: Impact
  canvas = createFrame();
  ctx = canvas.getContext('2d');
  fillBackground(ctx);
  drawCenteredText(ctx, 'Impact-Analyse:\nEXT-001 ändert sich\n\n→ 2 Requirements betroffen', { fontSize: 56 });
  saveFrame(canvas, '08-impact.png');

  // Frame 9: PageRank
  canvas = createFrame();
  ctx = canvas.getContext('2d');
  fillBackground(ctx);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '32px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PageRank', canvas.width / 2, canvas.height / 2 - 80);
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 64px Inter, Arial, sans-serif';
  ctx.fillText('SYS-003', canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = COLORS.text;
  ctx.font = '42px Inter, Arial, sans-serif';
  ctx.fillText('= kritischstes Requirement', canvas.width / 2, canvas.height / 2 + 70);
  saveFrame(canvas, '09-pagerank.png');

  // Frame 10: CTA
  canvas = createFrame();
  ctx = canvas.getContext('2d');
  fillBackground(ctx);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 72px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Von PDFs zu Wissen', canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillStyle = COLORS.accent;
  ctx.font = '48px Inter, Arial, sans-serif';
  ctx.fillText('Pilot in 4-6 Wochen', canvas.width / 2, canvas.height / 2 + 60);
  saveFrame(canvas, '10-cta.png');

  // Frame 11: Contact
  canvas = createFrame();
  ctx = canvas.getContext('2d');
  fillBackground(ctx, COLORS.backgroundDark);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 64px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('siglochconsulting.de', canvas.width / 2, canvas.height / 2);
  saveFrame(canvas, '11-contact.png');

  // Concat-File für ffmpeg erstellen
  const concatContent = `file 'generated/01-title.png'
duration 3
file 'generated/02-problem.png'
duration 5
file 'generated/03-rag-limit.png'
duration 5
file 'generated/04-graph.png'
duration 8
file 'generated/05-hierarchy.png'
duration 6
file 'generated/06-rules.png'
duration 6
file 'generated/07-violation.png'
duration 5
file 'generated/08-impact.png'
duration 6
file 'generated/09-pagerank.png'
duration 5
file 'generated/10-cta.png'
duration 5
file 'generated/11-contact.png'
duration 4
file 'generated/11-contact.png'
`;

  fs.writeFileSync(path.join(FRAMES_DIR, 'concat-2min.txt'), concatContent);
  console.log('\n✅ concat-2min.txt erstellt');

  console.log('\n🎥 Video erstellen mit:');
  console.log(`   cd ${FRAMES_DIR}`);
  console.log('   ffmpeg -f concat -safe 0 -i concat-2min.txt -vf "fps=30,format=yuv420p" -c:v libx264 ../output/demo-2min.mp4');
}

async function generate8MinFrames() {
  console.log('\n🎬 Generiere 8-Minuten Frames...\n');

  // Kapitel-Frames
  const chapters = [
    { num: 1, title: 'Das Problem' },
    { num: 2, title: 'RAG-Grenze' },
    { num: 3, title: 'Knowledge Graph' },
    { num: 4, title: 'Regel-Validierung' },
    { num: 5, title: 'Impact-Analyse' },
    { num: 6, title: 'Machine Learning' },
    { num: 7, title: 'Lernendes System' },
    { num: 8, title: 'Zusammenfassung' }
  ];

  for (const ch of chapters) {
    const canvas = createFrame();
    const ctx = canvas.getContext('2d');
    drawChapterHeader(ctx, ch.num, ch.title);
    saveFrame(canvas, `chapter-${ch.num}.png`);
  }

  // Content-Frames (Auswahl)
  // ... weitere Frames analog zu 2min

  console.log('\n✅ Kapitel-Frames erstellt');
  console.log('ℹ️  Für die vollständige 8-Min Version werden zusätzliche Content-Frames benötigt.');
}

// Main
async function main() {
  const version = process.argv[2] || '2min';

  console.log('🎬 Demo Video Frame Generator');
  console.log('==============================');

  if (version === '2min') {
    await generate2MinFrames();
  } else if (version === '8min') {
    await generate8MinFrames();
  } else {
    console.log('Usage: node generate-frames.js [2min|8min]');
  }
}

main().catch(console.error);
