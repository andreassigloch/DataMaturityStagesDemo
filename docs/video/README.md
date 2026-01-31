# Video Production Kit

Komplettes Kit zur Erstellung des Demo-Videos "Requirements Traceability mit Knowledge Graph".

## Inhalt

```
docs/video/
├── README.md                    # Diese Datei
├── frames.json                  # Frame-Definitionen (2min + 8min)
├── subtitles-2min.srt          # Untertitel für 2-Minuten-Version
├── subtitles-8min.srt          # Untertitel für 8-Minuten-Version
├── generate-frames.js           # Node.js Frame-Generator
├── generate-video.sh            # Shell-Script für ffmpeg
├── frames/                      # Screenshots hier ablegen
│   └── generated/               # Generierte Frames
└── recording-kit/               # Für manuelles Recording
    ├── queries.cypher           # Neo4j Queries zum Copy-Paste
    └── claude-prompts.md        # Claude Desktop Prompts
```

## Quick Start: 2-Minuten Video

### 1. Screenshots aufnehmen

**Dashboard Screenshots (manuell):**
1. Öffne http://localhost:5175
2. Mache Screenshots der Tabs:
   - Knowledge Graph → `frames/04-dashboard-overview.png`
   - Centrality Metrics → `frames/05-dashboard-centrality.png`
   - Detected Patterns → `frames/06-dashboard-patterns.png`
   - Rules → `frames/07-dashboard-rules.png`
   - Learning Timeline → `frames/08-dashboard-timeline.png`

**macOS Screenshot:**
```bash
# Vollbild
screencapture frames/04-dashboard-overview.png

# Oder mit Auswahl
screencapture -i frames/04-dashboard-overview.png
```

### 2. Frames generieren

```bash
# Installiere canvas (falls nicht vorhanden)
npm install canvas

# Generiere Text-Frames
node generate-frames.js 2min
```

### 3. Video erstellen

```bash
# Mit ffmpeg
cd frames
ffmpeg -f concat -safe 0 -i concat-2min.txt \
  -vf "fps=30,format=yuv420p" \
  -c:v libx264 -preset medium -crf 23 \
  ../output/demo-2min.mp4

# Mit Untertiteln
ffmpeg -i ../output/demo-2min.mp4 \
  -vf "subtitles=../subtitles-2min.srt:force_style='FontSize=24'" \
  -c:v libx264 -c:a copy \
  ../output/demo-requirements-traceability-2min.mp4
```

## Detaillierte Anleitung

### Variante A: Automatisch (Node.js + ffmpeg)

**Voraussetzungen:**
- Node.js 18+
- npm
- ffmpeg (`brew install ffmpeg`)
- canvas npm package (`npm install canvas`)

**Ablauf:**
```bash
# 1. Screenshots in frames/ ablegen
# 2. Frames generieren
node generate-frames.js 2min

# 3. Video erstellen
./generate-video.sh 2min

# 4. Ergebnis
open output/demo-requirements-traceability-2min.mp4
```

### Variante B: Manuell (Screen Recording)

**Tools:**
- OBS Studio oder ScreenFlow
- Neo4j Browser + Dashboard laufen lassen
- Claude Desktop mit MCP verbunden

**Ablauf:**
1. Starte Screen Recording (1920x1080, 30fps)
2. Folge dem Demo-Script: `demo-script.md`
3. Nutze `recording-kit/claude-prompts.md` für die Prompts
4. Nutze `recording-kit/queries.cypher` für Neo4j
5. Importiere `subtitles-*.srt` in Video-Editor

### Variante C: Hybrid (Screenshots + Video-Editor)

**Tools:**
- Screenshots (manuell oder automatisch)
- DaVinci Resolve / Premiere Pro / Canva

**Ablauf:**
1. Screenshots aufnehmen (siehe oben)
2. `frames.json` als Referenz für Timing
3. Screenshots in Video-Editor importieren
4. Übergänge und Text hinzufügen
5. `subtitles-*.srt` importieren
6. Musik hinzufügen

## Frame-Timing

### 2-Minuten Version (120 Sekunden)

| Frame | Dauer | Kumulativ | Inhalt |
|-------|-------|-----------|--------|
| 01-title | 3s | 0:03 | Titel |
| 02-problem | 5s | 0:08 | 4 Dokumente |
| 03-rag-limit | 5s | 0:13 | RAG-Grenze |
| 04-graph | 8s | 0:21 | Knowledge Graph |
| 05-hierarchy | 6s | 0:27 | STK→SYS→SW |
| 06-rules | 6s | 0:33 | 5 Regeln |
| 07-violation | 5s | 0:38 | SW-003 kein Test |
| 08-impact | 6s | 0:44 | Impact EXT-001 |
| 09-pagerank | 5s | 0:49 | PageRank |
| 10-cta | 5s | 0:54 | CTA |
| 11-contact | 4s | 0:58 | Kontakt |

*Gesamt: ~58s (mit Übergängen ~2:00)*

### 8-Minuten Version

Siehe `frames.json` für detailliertes Timing.

## Musik

**Empfohlene Quellen (lizenzfrei):**
- Epidemic Sound
- Artlist
- YouTube Audio Library

**Stil:**
- Ambient/Corporate
- Tempo: 80-100 BPM
- Keine Lyrics
- Lautstärke: -12dB unter Sprache

## Export-Einstellungen

| Parameter | Wert |
|-----------|------|
| Format | MP4 (H.264) |
| Auflösung | 1920x1080 |
| Framerate | 30 fps |
| Bitrate Video | 10-15 Mbps |
| Audio | AAC, 192 kbps |

## Troubleshooting

### ffmpeg nicht gefunden
```bash
brew install ffmpeg
```

### canvas npm install schlägt fehl
```bash
# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg
npm install canvas
```

### Screenshots zu dunkel
- Dashboard im Light Mode? Dark Mode empfohlen
- Bildschirmhelligkeit erhöhen
- Nachträglich Kontrast korrigieren

### Untertitel nicht sichtbar
- SRT-Datei muss UTF-8 sein
- Pfad zu SRT prüfen
- Font-Größe erhöhen (FontSize=32)

## Dateien im Repository

Die fertigen Videos werden NICHT ins Repository committed.

**Gitignore:**
```
docs/video/output/
docs/video/frames/generated/
*.mp4
```

## Support

Bei Fragen: andreas@siglochconsulting.de
