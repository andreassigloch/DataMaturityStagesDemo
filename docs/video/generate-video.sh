#!/bin/bash
# Video-Generator für Requirements Traceability Demo
# Benötigt: ffmpeg, ImageMagick (für Textframes)
#
# Usage: ./generate-video.sh [2min|8min]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRAMES_DIR="$SCRIPT_DIR/frames"
OUTPUT_DIR="$SCRIPT_DIR/output"
VERSION="${1:-2min}"

# Farben
BG_COLOR="#1a1a2e"
TEXT_COLOR="white"
ACCENT_COLOR="#4ade80"
WARNING_COLOR="#ff6b6b"

# Erstelle Output-Verzeichnis
mkdir -p "$OUTPUT_DIR"
mkdir -p "$FRAMES_DIR/generated"

echo "🎬 Generiere $VERSION Video..."

# Funktion: Text-Frame erstellen
create_text_frame() {
    local text="$1"
    local output="$2"
    local bg="${3:-$BG_COLOR}"
    local fg="${4:-$TEXT_COLOR}"

    convert -size 1920x1080 xc:"$bg" \
        -font "Inter-Bold" -pointsize 64 \
        -fill "$fg" -gravity center \
        -annotate 0 "$text" \
        "$output"
}

# Funktion: Screenshot mit Overlay
add_overlay() {
    local input="$1"
    local output="$2"
    local text="$3"
    local position="${4:-south}"

    convert "$input" \
        -fill "rgba(0,0,0,0.7)" -draw "rectangle 0,980 1920,1080" \
        -font "Inter-Bold" -pointsize 42 \
        -fill white -gravity "$position" \
        -annotate +0+20 "$text" \
        "$output"
}

# ============================================
# 2-MINUTEN VERSION
# ============================================
if [ "$VERSION" == "2min" ]; then
    echo "📸 Erstelle Frames für 2-Minuten-Version..."

    # Frame 1: Titel (3s = 90 frames @ 30fps)
    create_text_frame "Requirements Traceability\n\nVon PDFs zu Wissen" \
        "$FRAMES_DIR/generated/01-title.png"

    # Frame 2: Problem (5s)
    create_text_frame "4 Dokumente. 4 Formate.\n\nKeine Verbindung." \
        "$FRAMES_DIR/generated/02-problem.png"

    # Frame 3: RAG Limit (5s)
    create_text_frame "RAG findet Text...\n\n...aber keine Beziehungen." \
        "$FRAMES_DIR/generated/03-rag.png"

    # Frame 4: Knowledge Graph (verwende Dashboard Screenshot)
    if [ -f "$FRAMES_DIR/04-dashboard-overview.png" ]; then
        add_overlay "$FRAMES_DIR/04-dashboard-overview.png" \
            "$FRAMES_DIR/generated/04-graph.png" \
            "Knowledge Graph: Struktur statt Suche"
    fi

    # Frame 5: Hierarchy
    create_text_frame "STK → SYS → SW\n\nVollständige Traceability" \
        "$FRAMES_DIR/generated/05-hierarchy.png" "$BG_COLOR" "$ACCENT_COLOR"

    # Frame 6: Rules (verwende Dashboard Screenshot)
    if [ -f "$FRAMES_DIR/07-dashboard-rules.png" ]; then
        add_overlay "$FRAMES_DIR/07-dashboard-rules.png" \
            "$FRAMES_DIR/generated/06-rules.png" \
            "5 Regeln: A-SPICE + ISO 26262"
    fi

    # Frame 7: Violation
    create_text_frame "⚠️ SW-003 hat KEINEN Test!\n\nDas wäre ein Audit-Finding." \
        "$FRAMES_DIR/generated/07-violation.png" "#2d1f1f" "$WARNING_COLOR"

    # Frame 8: Impact
    create_text_frame "Impact-Analyse:\nEXT-001 ändert sich\n\n→ 2 Requirements betroffen" \
        "$FRAMES_DIR/generated/08-impact.png"

    # Frame 9: ML
    create_text_frame "PageRank:\nSYS-003 = kritischstes Requirement" \
        "$FRAMES_DIR/generated/09-ml.png"

    # Frame 10: CTA
    create_text_frame "Von PDFs zu Wissen\n\nPilot in 4-6 Wochen" \
        "$FRAMES_DIR/generated/10-cta.png"

    # Frame 11: Contact
    create_text_frame "siglochconsulting.de" \
        "$FRAMES_DIR/generated/11-contact.png" "#0a0a14"

    # Erstelle Concat-File für ffmpeg
    cat > "$FRAMES_DIR/concat-2min.txt" << EOF
file 'generated/01-title.png'
duration 3
file 'generated/02-problem.png'
duration 5
file 'generated/03-rag.png'
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
file 'generated/09-ml.png'
duration 5
file 'generated/10-cta.png'
duration 5
file 'generated/11-contact.png'
duration 4
file 'generated/11-contact.png'
EOF

    echo "🎥 Generiere Video..."

    # Video ohne Audio
    ffmpeg -y -f concat -safe 0 -i "$FRAMES_DIR/concat-2min.txt" \
        -vf "fps=30,format=yuv420p" \
        -c:v libx264 -preset medium -crf 23 \
        "$OUTPUT_DIR/demo-2min-silent.mp4"

    # Mit Untertiteln
    ffmpeg -y -i "$OUTPUT_DIR/demo-2min-silent.mp4" \
        -vf "subtitles=$SCRIPT_DIR/subtitles-2min.srt:force_style='FontName=Inter,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1'" \
        -c:v libx264 -preset medium -crf 23 \
        -c:a copy \
        "$OUTPUT_DIR/demo-requirements-traceability-2min.mp4"

    echo "✅ Video erstellt: $OUTPUT_DIR/demo-requirements-traceability-2min.mp4"
fi

# ============================================
# 8-MINUTEN VERSION
# ============================================
if [ "$VERSION" == "8min" ]; then
    echo "📸 8-Minuten-Version benötigt mehr Frames..."
    echo "   Bitte führe zuerst 'node generate-frames.js' aus"
    echo "   oder nutze das Recording-Kit manuell."
fi

echo ""
echo "📁 Ausgabe-Verzeichnis: $OUTPUT_DIR"
echo "📝 Untertitel: $SCRIPT_DIR/subtitles-$VERSION.srt"
