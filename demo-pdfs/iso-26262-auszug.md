# ISO 26262-8:2018 Auszug

**Road vehicles — Functional safety**
**Part 8: Supporting processes**

---

## 6 Specification and management of safety requirements

### 6.4 Requirements for safety requirements

#### 6.4.1 General

Sicherheitsanforderungen müssen so spezifiziert werden, dass sie die funktionale Sicherheit des Systems über den gesamten Lebenszyklus gewährleisten. Die Strenge der Anforderungen richtet sich nach dem zugewiesenen ASIL.

#### 6.4.2 Requirements for specification according to ASIL

Die folgenden Anforderungen gelten für die Spezifikation von Sicherheitsanforderungen in Abhängigkeit vom ASIL:

**6.4.2.1 ASIL A**

Sicherheitsanforderungen für ASIL A sollen:
- eindeutig und verständlich formuliert sein
- verifizierbar sein
- konsistent mit übergeordneten Anforderungen sein

**6.4.2.2 ASIL B**

Zusätzlich zu 6.4.2.1 sollen Sicherheitsanforderungen für ASIL B:
- quantitative Werte enthalten, wo anwendbar
- Randbedingungen explizit benennen

**6.4.2.3 ASIL C/D - Review Requirements**

> Für ASIL C und ASIL D müssen Sicherheitsanforderungen einem formalen Review unterzogen werden. Das Review muss von einer Person durchgeführt werden, die nicht an der Erstellung der Anforderung beteiligt war (Unabhängigkeitsprinzip).

**Review-Kriterien:**

| Kriterium | Prüfinhalt |
|-----------|------------|
| Vollständigkeit | Alle Aspekte des Sicherheitsziels adressiert |
| Eindeutigkeit | Keine mehrdeutigen Formulierungen |
| Konsistenz | Keine Widersprüche zu anderen Anforderungen |
| Verifizierbarkeit | Testmethode ableitbar |
| Rückverfolgbarkeit | Link zu übergeordneter Anforderung vorhanden |

**6.4.2.4 Bidirectional Traceability**

Für alle ASIL-Stufen ist eine bidirektionale Traceability zwischen:
- Sicherheitszielen und funktionalen Sicherheitsanforderungen
- Funktionalen Sicherheitsanforderungen und technischen Sicherheitsanforderungen
- Technischen Sicherheitsanforderungen und Implementierung

zu etablieren und aufrechtzuerhalten.

**6.4.2.5 ASIL C/D - Verification Requirements**

> Für ASIL C und ASIL D müssen alle Sicherheitsanforderungen durch mindestens eine der folgenden Methoden verifiziert werden:
>
> a) Inspektion
> b) Simulation
> c) Analyse
> d) Test am Zielsystem
>
> Die gewählte Methode ist zu begründen und zu dokumentieren.

**Tabelle 1 — Empfohlene Verifikationsmethoden nach ASIL**

| Methode | ASIL A | ASIL B | ASIL C | ASIL D |
|---------|--------|--------|--------|--------|
| Inspektion | + | + | ++ | ++ |
| Simulation | o | + | ++ | ++ |
| Analyse | + | + | ++ | ++ |
| Test | ++ | ++ | ++ | ++ |

*Legende: ++ stark empfohlen, + empfohlen, o optional*

---

## 6.5 Impact analysis for safety requirements changes

Bei Änderungen an Sicherheitsanforderungen ist eine Auswirkungsanalyse durchzuführen, die folgende Aspekte berücksichtigt:

1. Betroffene abhängige Anforderungen
2. Betroffene Systemkomponenten
3. Notwendige Regressionstests
4. Auswirkungen auf die Sicherheitsargumentation

> **ANMERKUNG:** Die Änderung einer Sicherheitsanforderung kann kaskadierende Auswirkungen auf die gesamte Traceability-Kette haben. Alle betroffenen Elemente sind zu identifizieren und entsprechend anzupassen.

---

*Dieser Auszug dient Schulungszwecken. Das vollständige Normendokument ist über ISO oder nationale Normungsinstitute erhältlich.*
