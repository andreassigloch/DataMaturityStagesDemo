# CAN-Bus Interface Spezifikation

**Chassis Domain - Fahrwerk-Team**

**Dokumentennummer:** IF-CAN-FW-2024-001
**Version:** 2.3
**Status:** Freigegeben
**Datum:** 28.02.2024
**Verantwortlich:** Thomas Becker, Interface-Koordination Fahrwerk

---

## 1. Geltungsbereich

Diese Spezifikation definiert die CAN-Bus-Schnittstellen der Fahrwerk-Domäne für die Plattform MQB-evo. Sie gilt für alle Steuergeräte, die Fahrdynamik-relevante Daten austauschen.

---

## 2. Allgemeine Parameter

| Parameter | Wert |
|-----------|------|
| Busgeschwindigkeit | 500 kBit/s |
| Protokoll | CAN 2.0B |
| Terminierung | 120 Ohm an Endknoten |
| Adressbereich | 0x100 - 0x1FF |

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

---

## 4. Änderungshistorie

| Version | Datum | Autor | Änderung |
|---------|-------|-------|----------|
| 1.0 | 15.03.2022 | T. Becker | Erstversion |
| 2.0 | 20.09.2022 | T. Becker | BrakePedalPos Signal hinzugefügt |
| 2.1 | 05.01.2023 | T. Becker | Timeout von 150ms auf 100ms |
| 2.2 | 12.07.2023 | T. Becker | Ungültigkeitswert definiert |
| **2.3** | **28.02.2024** | **T. Becker** | **Resolution BrakePedalForce von 0.5N auf 0.1N geändert** |

---

## 5. Wichtige Hinweise

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

---

## 6. Kontakt

Bei Fragen zur Interface-Spezifikation:

**Interface-Koordination Fahrwerk**
Thomas Becker
fahrwerk-interface@mustermann-automotive.de

---

*Dieses Dokument ist Eigentum der Mustermann Automotive GmbH. Änderungen nur über das offizielle Change-Management.*
