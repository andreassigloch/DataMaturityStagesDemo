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

Dieses Lastenheft definiert die Stakeholder-Anforderungen an das Außenlichtsystem der nächsten Fahrzeuggeneration (Plattform MQB-evo). Es dient als verbindliche Grundlage für die Systementwicklung und beschreibt die erwarteten Funktionen aus Kundensicht.

### 1.2 Geltungsbereich

Das Dokument gilt für alle Varianten des Außenlichtsystems einschließlich:
- Frontscheinwerfer (LED/Matrix-LED)
- Heckleuchten
- Seitenmarkierungsleuchten
- Dynamische Blinker
- Ambientebeleuchtung (Exterieur)

### 1.3 Referenzierte Dokumente

| ID | Dokument | Version |
|----|----------|---------|
| REF-001 | ECE R48 - Beleuchtungseinrichtungen | 2021 |
| REF-002 | ECE R87 - Tagfahrlicht | 2019 |
| REF-003 | Konzernlastenheft Lichtsysteme | 4.1 |
| REF-004 | CAN-Bus Interface Spezifikation | 2.3 |

---

## 2. Systemübersicht

### 2.1 Systemkontext

Das Außenlichtsystem ist ein sicherheitsrelevantes System (ASIL B) und steht in direkter Interaktion mit dem Fahrer, anderen Verkehrsteilnehmern sowie weiteren Fahrzeugsystemen. Die Kommunikation erfolgt primär über den Chassis-CAN-Bus.

### 2.2 Systemgrenzen

Das System umfasst die Steuergeräte, Aktuatoren und Sensorik der Außenbeleuchtung. Nicht im Scope sind:
- Innenraumbeleuchtung
- Instrumentenbeleuchtung
- Notfall-Warnblinkanlage (separates System)

---

## 3. Stakeholder-Anforderungen

### 3.1 Sicherheitsanforderungen

**STK-001: Ausfallsicherheit bei Nacht**

Das System muss bei einem Teilausfall des Hauptscheinwerfers eine Notbeleuchtung aktivieren, die dem Fahrer ein sicheres Anhalten ermöglicht. Der Fahrer ist unverzüglich optisch und akustisch zu warnen. Die Notbeleuchtung muss mindestens 15 Minuten funktionsfähig bleiben und eine Mindesthelligkeit von 100 Lux in 10m Entfernung gewährleisten.

**STK-002: Blendfreiheit bei Gegenverkehr**

Bei Erkennung entgegenkommender Fahrzeuge muss das Matrix-LED-System innerhalb von 300ms die entsprechenden Segmente abblenden, ohne die Fahrbahnausleuchtung für den Fahrer signifikant zu beeinträchtigen. Die Restblendung darf maximal 1 Lux auf Augenhöhe des Gegenverkehrs betragen.

### 3.2 Funktionale Anforderungen

**STK-003: Dynamische Lichtverteilung**

Das System soll die Lichtverteilung automatisch an die Fahrsituation anpassen. Bei Geschwindigkeiten über 100 km/h soll die Reichweite des Fernlichts um mindestens 30% gegenüber dem Standardmodus erhöht werden. Bei Kurvenfahrt soll das Kurvenlicht die Fahrbahn in Kurvenrichtung ausleuchten, wobei der Schwenkwinkel proportional zum Lenkwinkel sein muss.

**STK-004: Begrüßungs- und Verabschiedungsanimation**

Beim Entriegeln des Fahrzeugs soll eine charakteristische Lichtanimation ausgeführt werden, die die Markenidentität unterstreicht. Die Animation darf maximal 3 Sekunden dauern und muss bei Motorstart sofort abbrechen. Bei Verriegelung ist eine entsprechende Abschiedsanimation durchzuführen.

---

## 4. Technische Rahmenbedingungen

### 4.1 Elektrische Schnittstellen

- Bordnetzspannung: 12V nominal (9V-16V Betriebsbereich)
- Maximale Leistungsaufnahme: 250W (alle Funktionen aktiv)
- CAN-Bus: 500 kBit/s, ISO 11898-2
- LIN-Bus: 19.2 kBit/s für Nebenverbraucher

### 4.2 Umweltbedingungen

- Temperaturbereich: -40°C bis +85°C (Betrieb)
- Schutzart: IP69K (Frontscheinwerfer)
- Vibrationsfestigkeit: nach ISO 16750-3

### 4.3 EMV-Anforderungen

Das System muss die Grenzwerte nach CISPR 25 Klasse 5 einhalten und eine Störfestigkeit nach ISO 11452-2 aufweisen.

---

## 5. Schnittstellen zu anderen Systemen

### 5.1 CAN-Bus Kommunikation

Die Kommunikation mit dem Fahrwerks-Domain-Controller erfolgt über folgende Nachrichten:

| Message-ID | Name | Richtung | Zyklus |
|------------|------|----------|--------|
| 0x120 | LightCommand | Empfang | 20ms |
| 0x121 | LightStatus | Senden | 50ms |
| 0x123 | BrakePedalForce | Empfang | 10ms |
| 0x124 | VehicleSpeed | Empfang | 10ms |

### 5.2 Diagnose

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
| 2.0 | 15.06.2023 | S. Müller | Matrix-LED Anforderungen ergänzt |
| 3.0 | 20.11.2023 | S. Müller | ASIL B Einstufung, STK-001 verschärft |
| 3.1 | 08.02.2024 | S. Müller | STK-002: Zeitanforderung auf 300ms |
| 3.2 | 15.03.2024 | S. Müller | Interface-Referenzen aktualisiert |

---

*Dieses Dokument ist Eigentum der Mustermann Automotive GmbH. Vervielfältigung nur mit schriftlicher Genehmigung.*
