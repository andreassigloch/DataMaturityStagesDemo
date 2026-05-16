# Lastenheft Außenlichtsystem

**Dokumentennummer:** LH-ALS-2024-003
**Version:** 3.2
**Status:** Freigegeben
**Datum:** 15.03.2024
**Autor:** Dr. Stefan Müller, Systemarchitektur
**Geprüft:** M. Weber, Produktmanagement
**Freigabe:** K. Schmidt, Technische Leitung

---

## 1. Einleitung

### 1.1 Zweck des Dokuments

Dieses Lastenheft definiert die Stakeholder-Anforderungen an das Außenlichtsystem der nächsten Fahrzeuggeneration (Plattform MQB-evo). Es dient als verbindliche Grundlage für die Systementwicklung und beschreibt die erwarteten Funktionen aus Kundensicht. Der Scope der ersten Iteration umfasst die Signalisierungsfunktionen Blinker, Bremslicht und Warnblinker; Frontscheinwerfer und Matrix-LED werden in einem separaten Lastenheft (LH-ALS-FRONT-2024) behandelt.

### 1.2 Geltungsbereich

Das Dokument gilt für die signalgebenden Außenleuchten:

- Vordere und hintere Blinker (Fahrtrichtungsanzeiger)
- Bremslichter
- Warnblinkanlage
- Heckleuchten als Träger der o.g. Funktionen

### 1.3 Referenzierte Dokumente

| ID | Dokument | Version |
|----|----------|---------|
| REF-001 | ECE R6 - Fahrtrichtungsanzeiger | 2020 |
| REF-002 | ECE R7 - Begrenzungs-, Schluss-, Bremsleuchten | 2018 |
| REF-003 | ECE R112 - Asymmetrische Scheinwerfer | 2019 |
| REF-004 | ISO 26262 - Functional Safety Road Vehicles | 2018 |
| REF-005 | A-SPICE - Automotive SPICE Process Reference Model | 4.0 |
| REF-006 | CAN-Bus Interface Spezifikation Fahrwerk-Domain | 2.3 |

---

## 2. Systemübersicht

### 2.1 Systemkontext

Das Außenlichtsystem ist ein sicherheitsrelevantes System und steht in direkter Interaktion mit dem Fahrer, anderen Verkehrsteilnehmern sowie weiteren Fahrzeugsystemen. Die Kommunikation mit dem Fahrwerk-Domain-Controller (Bremspedalsignal) erfolgt über den Chassis-CAN-Bus.

ASIL-Klassifizierung der Teilfunktionen:

- Blinker: ASIL B
- Bremsvorgangs-Erkennung (Stakeholder-Sicht): ASIL D
- Bremslicht-Aktorik (System-/SW-Ebene): ASIL C, einzelne sicherheitskritische Pfade bis ASIL D
- Warnblinker: ASIL C

### 2.2 Systemgrenzen

Das System umfasst die Steuergeräte, Aktuatoren und Sensorik der signalgebenden Außenbeleuchtung. Nicht im Scope sind:

- Frontscheinwerfer (Abblend-/Fernlicht, Matrix-LED) — separates Lastenheft
- Tagfahrlicht
- Innenraumbeleuchtung

---

## 3. Stakeholder-Anforderungen

### 3.1 Signalisierung

**STK-001: Abbiegeabsicht signalisieren**

Der Fahrer muss seine Abbiegeabsicht den anderen Verkehrsteilnehmern signalisieren können. Die Aktivierung erfolgt über den Lenkstockhebel; die Anzeige muss für nachfolgende Fahrzeuge und Gegenverkehr eindeutig erkennbar sein. Klassifizierung: ASIL B.

**STK-002: Bremsvorgang erkennbar**

Nachfolgende Fahrzeuge müssen einen Bremsvorgang des vorausfahrenden Fahrzeugs zuverlässig und mit minimaler Verzögerung erkennen können. Eine spät oder nicht erkannte Bremsung kann zu schweren Auffahrunfällen führen, weshalb diese Stakeholder-Anforderung mit ASIL D eingestuft ist. Die abgeleiteten System- und Software-Anforderungen können bei nachgewiesener Risikoreduktion (z.B. redundante Pfade) auf ASIL C heruntergebrochen werden.

### 3.2 Sicherheit & Notfall

**STK-003: Fahrbahn ausleuchten**

Das Fahrzeug muss bei Dunkelheit die Fahrbahn vor dem Fahrzeug ausleuchten können, um sicheres Fahren zu ermöglichen. Hinweis: Die detaillierten Anforderungen an die Frontscheinwerfer werden in LH-ALS-FRONT-2024 spezifiziert; in diesem Lastenheft wird die Funktion lediglich als Stakeholder-Anforderung referenziert. Klassifizierung: ASIL B.

**STK-004: Warnblinker bei Panne**

Der Fahrer muss bei einer Panne oder gefährlichen Verkehrssituation den Warnblinker aktivieren können, auch bei abgeschalteter Zündung. Die Funktion muss alle Blinker synchron ansteuern. Klassifizierung: ASIL C.

---

## 4. Technische Rahmenbedingungen

### 4.1 Elektrische Schnittstellen

- Bordnetzspannung: 12V nominal (9V-16V Betriebsbereich)
- Maximale Leistungsaufnahme: 80W (alle Signal-Funktionen aktiv)
- CAN-Bus: 500 kBit/s, ISO 11898-2
- LIN-Bus: 19.2 kBit/s für Nebenverbraucher

### 4.2 Umweltbedingungen

- Temperaturbereich: -40°C bis +85°C (Betrieb)
- Schutzart: IP67 (Heckleuchten)
- Vibrationsfestigkeit: nach ISO 16750-3

### 4.3 EMV-Anforderungen

Das System muss die Grenzwerte nach CISPR 25 Klasse 5 einhalten und eine Störfestigkeit nach ISO 11452-2 aufweisen.

---

## 5. Schnittstellen zu anderen Systemen

### 5.1 CAN-Bus Kommunikation

Die Kommunikation mit dem Fahrwerks-Domain-Controller erfolgt über folgende Nachrichten. Insbesondere `BrakePedalForce` (0x123) ist sicherheitsrelevant für die Bremslicht-Auslösung — Änderungen an dieser Nachricht durch das Fahrwerk-Team müssen dem Außenlicht-Team vorab kommuniziert werden.

| Message-ID | Name | Richtung | Zyklus | Quelle |
|------------|------|----------|--------|--------|
| 0x123 | BrakePedalForce | Empfang | 10ms | Fahrwerk-Team |
| 0x124 | VehicleSpeed | Empfang | 10ms | Plattform-Team |
| 0x130 | IgnitionStatus | Empfang | 100ms | Plattform-Team |
| 0x140 | LightStatus | Senden | 50ms | Außenlicht-Team |

### 5.2 Externe Spezifikationen (Inputs anderer Teams)

Die folgenden Vorgaben anderer Teams sind verbindlich und beeinflussen unsere Auslegung. Die ASIL-Klassifikation der Eingabe begrenzt nach ISO 26262-9 die maximal zulässige ASIL-Stufe der davon abgeleiteten Sicherheitsanforderungen.

| Input | Quelle | Version | ASIL | Beeinflusst |
|-------|--------|---------|------|-------------|
| **EXT-001 — CAN BrakePedalForce 0x123** | Fahrwerk-Team | 2.3 | D | SW-002 (Bremslicht-Schwellwert 5–15 N hängt an Resolution 0.1 N) |
| **EXT-002 — CAN Zykluszeit Plattform** | Plattform-Team | 1.1 | B | SYS-003 (Bremslicht <50 ms hängt an Bus-Zykluszeit 10 ms) |
| **EXT-003 — CAN Timeout Handling** | Safety-Team | 4.0 | C | SW-002 (Fail-Safe bei CAN-Timeout >100 ms) |

**ASIL-Vererbungsregel:** Wird ein Requirement aus mehreren Inputs abgeleitet, gilt das Maximum der Eingabe-ASIL als Obergrenze. Eine Anhebung über das Maximum hinaus ist ohne dokumentierte ASIL-Decomposition (ISO 26262-9, §5) unzulässig und muss in der Validierung als Befund auftauchen.

### 5.3 Diagnose

- UDS nach ISO 14229-1
- Fehlerspeicher nach ISO 14229-3
- Mindestens 20 Fehlercodes definieren

---

## 6. Qualitätsanforderungen

### 6.1 Zuverlässigkeit

- MTBF: > 15.000 Betriebsstunden
- Ausfallrate: < 100 ppm im ersten Jahr

### 6.2 Wartbarkeit

- Leuchtmittelwechsel ohne Spezialwerkzeug
- Diagnosefähigkeit über Standard-OBD-Interface

---

## Änderungshistorie

| Version | Datum | Autor | Änderung |
|---------|-------|-------|----------|
| 1.0 | 10.01.2023 | S. Müller | Erstversion |
| 2.0 | 15.06.2023 | S. Müller | Bremslicht ASIL C ergänzt |
| 3.0 | 20.11.2023 | S. Müller | Warnblinker als eigene Funktion (STK-004), CAN-Schnittstellen präzisiert |
| 3.1 | 08.02.2024 | S. Müller | EXT-001..003 als externe Inputs explizit ausgewiesen |

---

*Dieses Dokument ist Eigentum der Mustermann Automotive GmbH. Vervielfältigung nur mit schriftlicher Genehmigung.*
