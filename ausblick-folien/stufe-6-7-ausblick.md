# Ausblick: Die nächsten Stufen der Datenreife

---

## Stufe 6: Prediction (Business Value: 85-90%)

### Was wäre möglich?

**Änderungsrisiko-Vorhersage:**
- "SYS-003 hat 73% Wahrscheinlichkeit für Änderung in den nächsten 2 Sprints"
- Graph Neural Networks analysieren historische Änderungsmuster
- Proaktive Warnungen statt reaktiver Brandlöschung

**Typische Fragen, die beantwortet werden:**
- Welche Requirements sind "instabil"?
- Wo entstehen erfahrungsgemäß die meisten Nacharbeiten?
- Welche Schnittstellen sind kritische Hotspots?

**Voraussetzung:** Änderungshistorie im Graph (wir tracken bereits DEPENDS_ON)

---

## Stufe 7: Lernende Systeme (Business Value: 90-100%)

### Die Vision

**Aus Feedback lernen:**
- Review-Kommentare fließen zurück ins System
- "Diese Formulierung führt oft zu Rückfragen"
- Automatische Qualitätsverbesserung

**Wissen teilen:**
- "Ähnliches Requirement in Projekt X war so formuliert..."
- Föderiertes Lernen über Projekte hinweg
- Ohne sensible Daten zu teilen

**Automatische Vorschläge:**
- Bei neuen Requirements: "Basierend auf 500 ähnlichen..."
- Testvorschläge aus historischen Patterns
- Architektur-Empfehlungen

---

## Der Weg dorthin

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ✅ HEUTE: Fundament (Stufe 3-5)                        │
│     • Struktur aufbauen                                 │
│     • Regeln definieren                                 │
│     • Compliance messen                                 │
│                                                         │
│  ➜ MORGEN: Darauf aufbauen (Stufe 6-7)                 │
│     • Historische Daten sammeln                         │
│     • ML-Modelle trainieren                             │
│     • Feedback-Loops etablieren                         │
│                                                         │
│  💡 KERNBOTSCHAFT:                                      │
│     70-80% des Business Value kommt aus                 │
│     Struktur und Regeln – nicht aus KI.                 │
│     KI ist der Turbo, nicht das Fundament.              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Für Ihre nächsten Schritte

1. **Fundament legen:** Graph-basiertes Requirements-Management einführen
2. **Daten sammeln:** Änderungen und Reviews systematisch tracken
3. **Schrittweise automatisieren:** Mit einfachen Regeln starten
4. **Perspektive:** Prediction und Learning als langfristiges Ziel

**Fragen?**

---

*Sigloch Consulting – Systems Engineering & GenAI*
