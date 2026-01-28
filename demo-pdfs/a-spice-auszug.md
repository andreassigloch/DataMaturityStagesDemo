# Automotive SPICE 4.0 - Auszug

**Prozessreferenzmodell**
**Stand:** Version 4.0, November 2023
**Quelle:** VDA QMC / Intacs

---

## SYS.2 System Requirements Analysis

### Prozesszweck

Der Zweck des Prozesses "System Requirements Analysis" ist es, die Stakeholder-Anforderungen in eine Menge von Systemanforderungen zu transformieren, die das gewünschte Systemverhalten beschreiben und als Grundlage für die Systemarchitektur dienen.

### Prozessergebnisse

Als Ergebnis der erfolgreichen Implementierung dieses Prozesses:

1. Die Systemanforderungen sind identifiziert und dokumentiert.
2. Die Systemanforderungen sind kategorisiert und priorisiert.
3. Die Auswirkungen der Systemanforderungen auf die Betriebsumgebung sind analysiert.
4. Die Konsistenz zwischen Stakeholder-Anforderungen und Systemanforderungen ist etabliert.
5. Die Systemanforderungen sind mit den Stakeholder-Anforderungen bilateral verfolgt.

---

### BP5: Establish bidirectional traceability

**Basispraktik:**

Etabliere bidirektionale Traceability zwischen Stakeholder-Anforderungen und Systemanforderungen. Etabliere bidirektionale Traceability zwischen Systemanforderungen und Arbeitsprodukten der Systemarchitektur.

**Hinweis:**

Bidirektionale Traceability unterstützt:
- Konsistenzprüfung
- Abdeckungsanalyse
- Auswirkungsanalyse bei Änderungen
- Statusverfolgung

**Bewertungsindikatoren:**

| Indikator | Beschreibung |
|-----------|--------------|
| Traceability-Matrix | Vollständige Matrix zwischen STK-REQ und SYS-REQ |
| Abdeckung | Jede Stakeholder-Anforderung durch mindestens eine Systemanforderung abgedeckt |
| Rückverfolgung | Jede Systemanforderung auf mindestens eine Stakeholder-Anforderung rückverfolgbar |
| Werkzeugunterstützung | Traceability in Requirements-Management-Tool gepflegt |

**Compliance-Kriterium:**

> Für jeden Link in der Traceability-Matrix muss die Begründung der Zuordnung dokumentiert sein. Verwaiste Anforderungen (ohne Vor- oder Rückwärts-Link) sind zu identifizieren und zu begründen.

---

## SWE.4 Software Unit Verification

### Prozesszweck

Der Zweck des Prozesses "Software Unit Verification" ist es, Software-Units zu verifizieren, um nachzuweisen, dass sie die zugehörigen Anforderungen erfüllen.

### Prozessergebnisse

Als Ergebnis der erfolgreichen Implementierung dieses Prozesses:

1. Eine Strategie zur Verifikation der Software-Units ist entwickelt.
2. Kriterien für die Software-Unit-Verifikation sind spezifiziert.
3. Software-Units werden gemäß der definierten Strategie verifiziert.
4. Verifikationsergebnisse werden dokumentiert.
5. Die Konsistenz zwischen Software-Units und Software-Design wird sichergestellt.

---

### BP3: Verify software units

**Basispraktik:**

Verifiziere Software-Units gegen die spezifizierten Verifikationskriterien unter Verwendung der definierten Verifikationsstrategie.

**Hinweis:**

Verifikationsmethoden umfassen typischerweise:
- Code-Review (statische Analyse)
- Unit-Tests (dynamische Analyse)
- Formal-Verifikation (bei ASIL C/D)

**Verifikationskriterien:**

| Kriterium | Methode | ASIL Relevanz |
|-----------|---------|---------------|
| Funktionale Korrektheit | Unit-Test | A/B/C/D |
| Grenzwertverhalten | Unit-Test | A/B/C/D |
| Robustheit | Unit-Test | B/C/D |
| Code-Standards | Statische Analyse | A/B/C/D |
| Speicherverhalten | Dynamische Analyse | C/D |
| Laufzeitverhalten | Profiling | C/D |

**Compliance-Kriterium:**

> Für jede Software-Unit muss ein Verifikationsbericht existieren, der die angewandten Methoden, die Testergebnisse und die Abdeckungsmetriken dokumentiert. Bei ASIL C/D ist eine Testabdeckung von mindestens MC/DC erforderlich.

---

## Bewertungsskala

| Level | Bezeichnung | Erfüllungsgrad |
|-------|-------------|----------------|
| 0 | Incomplete | 0-15% |
| 1 | Performed | 16-50% (BP erfüllt) |
| 2 | Managed | 51-85% (PA 2.1, 2.2) |
| 3 | Established | 86-100% (PA 3.1, 3.2) |

---

*Dieser Auszug dient Schulungszwecken. Das vollständige Prozessmodell ist über VDA QMC erhältlich.*
