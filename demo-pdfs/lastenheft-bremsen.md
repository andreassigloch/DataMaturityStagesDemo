# Lastenheft Bremssystem — Auszug: CAN-Schnittstellen

**Chassis Domain - Fahrwerk-Team**

**Dokumentennummer:** LH-BR-2024-001 (Auszug §3 CAN-Schnittstellen)
**Version:** 2.3
**Status:** Freigegeben
**Datum:** 28.02.2024
**Verantwortlich:** Thomas Becker, Interface-Koordination Fahrwerk

> **Hinweis:** Dieser Auszug umfasst die nach außen sichtbaren CAN-Schnittstellen des Bremssystems. Die fahrzeuginterne Funktionsspezifikation (ABS/ESP/Bremskraftverstärkung) ist nicht Teil dieses Auszugs.

---

## 1. Geltungsbereich

Dieser Lastenheft-Auszug definiert die CAN-Bus-Schnittstellen des Bremssystems der Fahrwerk-Domäne für die Plattform MQB-evo. Er gilt für alle Steuergeräte, die Fahrdynamik-relevante Daten mit dem Bremssystem austauschen, einschließlich der von Empfänger-Domänen genutzten Plattform-weiten Vorgaben (Zykluszeit, Timeout-Handling).

---

## 2. Allgemeine Parameter

| Parameter | Wert | Quelle |
|-----------|------|--------|
| Busgeschwindigkeit | 500 kBit/s | Plattform-Team |
| Maximale Zykluszeit (Plattform-Vorgabe) | 10 ms | Plattform-Team (PLT-CAN-2024, v1.1) |
| Protokoll | CAN 2.0B | Plattform-Team |
| Terminierung | 120 Ohm an Endknoten | Plattform-Team |
| Adressbereich Fahrwerk | 0x100 - 0x1FF | Fahrwerk-Team |
| Timeout-Handling | Fail-Safe ab >100 ms | Safety-Team (SAF-CAN-2024, v4.0) |

> **Hinweis:** Die maximale Zykluszeit (10 ms) ist eine plattformweite Vorgabe und legt damit die obere Grenze für alle reaktionszeitkritischen Auswertungen fest. Empfänger-Systeme dürfen sich auf diese Garantie verlassen, müssen aber bei Überschreitung in den durch das Safety-Team definierten Fail-Safe-Zustand übergehen.

---

## 3. Message-Definitionen

### 3.1 Message 0x123 - BrakePedalForce

**Zweck:** Übermittlung der Bremspedalkraft vom Bremskraftverstärker-Steuergerät an alle abhängigen Systeme.

| Eigenschaft | Wert |
|-------------|------|
| Message-ID | 0x123 |
| DLC | 4 Bytes |
| Cycle Time | 10 ms |
| Timeout | 100 ms |
| Sender | Bremskraftverstärker (BKV-SG) |
| **ASIL-Klassifikation** | **D** |

**Signal-Definition:**

| Signal | Startbit | Länge | Faktor | Offset | Min | Max | Einheit |
|--------|----------|-------|--------|--------|-----|-----|---------|
| BrakePedalForce | 0 | 12 | 0.1 | 0 | 0 | 409.5 | N |
| BrakePedalPos | 12 | 10 | 0.1 | 0 | 0 | 102.3 | % |
| BrakeSwitch | 22 | 1 | 1 | 0 | 0 | 1 | - |
| Reserved | 23 | 9 | - | - | - | - | - |

**Signal BrakePedalForce:**

- **Physikalischer Bereich:** 0 N bis 409.5 N
- **Resolution:** 0.1 N
- **Genauigkeit:** ± 2 N
- **Ungültigkeitswert:** 0xFFF (4095 raw = Signal invalid)

**Timing-Anforderungen:**

- Jitter: < 2 ms
- Latenz (Sensor bis CAN): < 5 ms
- Signalalter-Information: Byte 3, Bit 0-7 (Zähler 0-255)

**Sicherheitsrelevanz:**

Da Bremslicht-Auslösung und ESP-Eingriffe dieses Signal als Eingangsgröße verwenden und beide Funktionen sicherheitskritisch sind, ist die Message als ASIL D klassifiziert. Empfangende Systeme dürfen abgeleitete Sicherheitsanforderungen mit ASIL ≤ D modellieren; eine Anhebung über die Sender-Klassifikation hinaus ist gemäß ISO 26262-9 nicht zulässig.

---

## 4. Plattformweite Vorgaben

Die folgenden Festlegungen werden nicht vom Fahrwerk-Team selbst getroffen, sind aber für alle CAN-Empfänger der Fahrwerk-Domäne verbindlich. Sie sind hier zusammengefasst, weil sie die Auslegung jedes Empfängers betreffen.

### 4.1 Maximale Zykluszeit (Plattform)

| Eigenschaft | Wert |
|-------------|------|
| Quelle | Plattform-Team |
| Quelldokument | PLT-CAN-2024, v1.1 |
| Garantierte max. Zykluszeit | 10 ms |
| Geltung | alle Messages im Adressbereich 0x100–0x1FF |
| ASIL-Klassifikation | B |

**Bedeutung für Empfänger:** Reaktionszeit-Anforderungen (z.B. „Bremslicht <50 ms") sind nur erfüllbar, solange der Bus die Zykluszeit einhält. Bei Erhöhung der Zykluszeit (z.B. durch zusätzliche Teilnehmer) müssen alle Empfänger ihre Reaktionszeit-Budgets neu bewerten.

### 4.2 Timeout-Handling

| Eigenschaft | Wert |
|-------------|------|
| Quelle | Safety-Team |
| Quelldokument | SAF-CAN-2024, v4.0 |
| Timeout-Schwelle | 100 ms |
| Geforderte Reaktion | Fail-Safe-Zustand aktivieren |
| ASIL-Klassifikation | C |

**Bedeutung für Empfänger:** Bei Ausbleiben einer erwarteten Message für >100 ms ist die zuletzt empfangene Information als ungültig zu betrachten. Empfänger müssen einen vom Safety-Konzept des jeweiligen Systems definierten Fail-Safe-Zustand einnehmen (z.B. Bremslicht-Auslösung über Hardware-Fallback).

---

## 5. Änderungshistorie

| Version | Datum | Autor | Änderung |
|---------|-------|-------|----------|
| 1.0 | 15.03.2022 | T. Becker | Erstversion |
| 2.0 | 20.09.2022 | T. Becker | BrakePedalPos Signal hinzugefügt |
| 2.1 | 05.01.2023 | T. Becker | Timeout von 150ms auf 100ms |
| 2.2 | 12.07.2023 | T. Becker | Ungültigkeitswert definiert |
| 2.3 | 28.02.2024 | T. Becker | **Resolution BrakePedalForce von 0.5N auf 0.1N geändert**; ASIL-Klassifikation explizit ausgewiesen; Plattform-/Safety-Vorgaben (§4) konsolidiert |

---

## 6. Wichtige Hinweise

### ⚠️ ACHTUNG - Interface-Änderung in v2.3

> **Die Resolution des Signals BrakePedalForce wurde von 0.5 N auf 0.1 N geändert!**
>
> Diese Änderung betrifft die Interpretation der Rohdaten. Systeme, die bisher mit Faktor 0.5 gerechnet haben, müssen auf Faktor 0.1 umgestellt werden.
>
> **Abhängige Systeme informieren!**

**Auswirkung der Änderung:**

| Rohdatenwert | Alt (v2.2) | Neu (v2.3) |
|--------------|------------|------------|
| 100 | 50.0 N | 10.0 N |
| 500 | 250.0 N | 50.0 N |
| 1000 | 500.0 N | 100.0 N |

> **Hinweis zur Empfängerseite:** Das Bremskraftverstärker-Steuergerät kennt seine Empfänger nicht. Welche Systeme das Signal verwenden, ist nur über projekt- oder konzernweite Verknüpfungsdatenbanken bzw. die jeweiligen Empfänger-Lastenhefte ermittelbar.
>
> **ISO 26262-8 §6.5 (Impact-Analyse):** Die Resolution-Änderung ist eine Schnittstellenänderung an einem ASIL-D-Signal. Empfänger müssen die Auswirkung auf ihre Sicherheitsanforderungen analysieren, betroffene Tests neu durchführen und die Sicherheitsargumentation aktualisieren.

---

## 7. Kontakt

Bei Fragen zur Interface-Spezifikation:

**Interface-Koordination Fahrwerk**
Thomas Becker
fahrwerk-interface@mustermann-automotive.de

---

*Dieses Dokument ist Eigentum der Mustermann Automotive GmbH. Änderungen nur über das offizielle Change-Management.*
