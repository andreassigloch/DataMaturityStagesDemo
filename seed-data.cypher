// =====================================================
// SEED-DATEN: Requirements Traceability Demo
// Automotive Aussenlichtsystem
// =====================================================
// WICHTIG: Keine Regeln vorinstalliert!
// Die werden in der Demo live aus PDFs extrahiert.
// =====================================================

// =====================================================
// STAKEHOLDER REQUIREMENTS (Kundensicht)
// =====================================================

CREATE (stk1:StakeholderReq {
  id: 'STK-001',
  titel: 'Abbiegeabsicht signalisieren',
  beschreibung: 'Der Fahrer muss seine Abbiegeabsicht den anderen Verkehrsteilnehmern signalisieren koennen.',
  prioritaet: 'Muss',
  status: 'approved',
  asil: 'B'
})

CREATE (stk2:StakeholderReq {
  id: 'STK-002',
  titel: 'Bremsvorgang erkennbar',
  beschreibung: 'Nachfolgende Fahrzeuge muessen einen Bremsvorgang des vorausfahrenden Fahrzeugs erkennen koennen.',
  prioritaet: 'Muss',
  status: 'approved',
  asil: 'D'
})

CREATE (stk3:StakeholderReq {
  id: 'STK-003',
  titel: 'Fahrbahn ausleuchten',
  beschreibung: 'Das Fahrzeug muss bei Dunkelheit die Fahrbahn ausleuchten koennen.',
  prioritaet: 'Muss',
  status: 'approved',
  asil: 'B'
})

CREATE (stk4:StakeholderReq {
  id: 'STK-004',
  titel: 'Warnblinker bei Panne',
  beschreibung: 'Der Fahrer muss den Warnblinker bei einer Panne aktivieren koennen.',
  prioritaet: 'Muss',
  status: 'approved',
  asil: 'C'
});

// =====================================================
// SYSTEM REQUIREMENTS (Technische Ableitung)
// =====================================================

CREATE (sys1:SystemReq {
  id: 'SYS-001',
  titel: 'Blinker Reaktionszeit <100ms',
  beschreibung: 'Blinkanlage muss innerhalb 100ms nach Hebelbetaetigung aktiv sein.',
  asil: 'B',
  status: 'approved',
  standard: 'ECE R6'
})

CREATE (sys2:SystemReq {
  id: 'SYS-002',
  titel: 'Blinkfrequenz 1.5Hz',
  beschreibung: 'Blinkfrequenz: 1.5 Hz +/- 0.5 Hz gemaess ECE R6.',
  asil: 'B',
  status: 'approved',
  standard: 'ECE R6'
})

CREATE (sys3:SystemReq {
  id: 'SYS-003',
  titel: 'Bremslicht Reaktionszeit <50ms',
  beschreibung: 'Bremslicht muss bei Pedaldruck >5N innerhalb 50ms leuchten.',
  asil: 'C',
  status: 'approved',
  standard: 'ECE R7'
})

CREATE (sys4:SystemReq {
  id: 'SYS-004',
  titel: 'Bremslicht Intensitaet 80-300cd',
  beschreibung: 'Bremslichtintensitaet muss zwischen 80-300 cd liegen.',
  asil: 'B',
  status: 'approved',
  standard: 'ECE R7'
})

CREATE (sys5:SystemReq {
  id: 'SYS-005',
  titel: 'Abblendlicht Reichweite 40m',
  beschreibung: 'Abblendlicht muss Ausleuchtung von mindestens 40m gewaehrleisten.',
  asil: 'B',
  status: 'approved',
  standard: 'ECE R112'
})

CREATE (sys6:SystemReq {
  id: 'SYS-006',
  titel: 'Warnblinker synchron',
  beschreibung: 'Warnblinker muss alle Blinker synchron aktivieren.',
  asil: 'B',
  status: 'approved',
  standard: 'ECE R6'
})

CREATE (sys7:SystemReq {
  id: 'SYS-007',
  titel: 'Warnblinker ohne Zuendung',
  beschreibung: 'Warnblinker muss auch bei Zuendung AUS funktionieren.',
  asil: 'C',
  status: 'approved',
  standard: 'ECE R6'
});

// =====================================================
// SOFTWARE REQUIREMENTS
// =====================================================

CREATE (sw1:SoftwareReq {
  id: 'SW-001',
  titel: 'Blinkertimer 333ms',
  beschreibung: 'Timer fuer Blinker: 333ms ON, 333ms OFF fuer 1.5Hz.',
  status: 'implemented',
  asil: 'B'
})

CREATE (sw2:SoftwareReq {
  id: 'SW-002',
  titel: 'Bremslicht-Schwellwert konfigurierbar',
  beschreibung: 'Bremslicht-Schwellwert konfigurierbar (5-15N).',
  status: 'implemented',
  asil: 'D'
})

CREATE (sw3:SoftwareReq {
  id: 'SW-003',
  titel: 'Warnblinker Override',
  beschreibung: 'Warnblinker ueberschreibt Einzelblinker-Betrieb.',
  status: 'implemented',
  asil: 'B'
})

CREATE (sw4:SoftwareReq {
  id: 'SW-004',
  titel: 'Batterie-Watchdog',
  beschreibung: 'Batterie-Watchdog fuer Warnblinker-Betrieb ohne Zuendung.',
  status: 'implemented',
  asil: 'C'
});

// =====================================================
// TEST CASES
// ACHTUNG: TC-005 fehlt ABSICHTLICH! (Demo-Luecke)
// =====================================================

CREATE (tc1:TestCase {
  id: 'TC-001',
  titel: 'Blinker Timing Test',
  beschreibung: 'Prueft Blinkerhebel -> Licht an in <100ms.',
  typ: 'Timing',
  status: 'passed',
  ergebnis: 'OK - 78ms gemessen'
})

CREATE (tc2:TestCase {
  id: 'TC-002',
  titel: 'Blinkfrequenz Test',
  beschreibung: 'Frequenzmessung 1.5Hz +/- 0.5Hz.',
  typ: 'Messung',
  status: 'passed',
  ergebnis: 'OK - 1.49Hz gemessen'
})

CREATE (tc3:TestCase {
  id: 'TC-003',
  titel: 'Bremslicht Timing Test',
  beschreibung: 'Bremspedal 5N -> Licht an in <50ms.',
  typ: 'Timing',
  status: 'passed',
  ergebnis: 'OK - 34ms gemessen'
})

CREATE (tc4:TestCase {
  id: 'TC-004',
  titel: 'Warnblinker Standalone Test',
  beschreibung: 'Warnblinker funktioniert bei Motor aus.',
  typ: 'Funktional',
  status: 'pending',
  ergebnis: null
});

// TC-005 fehlt ABSICHTLICH!
// SW-003 (Warnblinker Override) hat keinen zugeordneten Test.
// Das ist die Demo-Luecke fuer die Validierung.

// =====================================================
// KOMPONENTEN (Architektur)
// =====================================================

CREATE (k1:Komponente {
  id: 'K-001',
  name: 'LightController ECU',
  typ: 'Hardware',
  beschreibung: 'Zentrale Steuereinheit fuer Aussenbeleuchtung',
  asil: 'D'
})

CREATE (k2:Komponente {
  id: 'K-002',
  name: 'BlinkerModule',
  typ: 'Software',
  beschreibung: 'Software-Modul fuer Blinkersteuerung',
  asil: 'B'
})

CREATE (k3:Komponente {
  id: 'K-003',
  name: 'BrakeLightModule',
  typ: 'Software',
  beschreibung: 'Software-Modul fuer Bremslichtsteuerung',
  asil: 'D'
})

CREATE (k4:Komponente {
  id: 'K-004',
  name: 'HazardLightModule',
  typ: 'Software',
  beschreibung: 'Software-Modul fuer Warnblinkanlage',
  asil: 'C'
});

// =====================================================
// EXTERNE ABHAENGIGKEITEN (Der blinde Fleck!)
// Input-Spezifikationen von anderen Teams
// =====================================================

CREATE (ext1:InputSpec {
  id: 'EXT-001',
  titel: 'CAN BrakePedalForce 0x123',
  beschreibung: 'CAN-Message 0x123 liefert Pedalkraft in 0.1N Aufloesung.',
  quelle: 'Fahrwerk-Team',
  version: '2.3',
  resolution: '0.1N',
  cycleTime: '10ms',
  asil: 'D'
})

CREATE (ext2:InputSpec {
  id: 'EXT-002',
  titel: 'CAN Zykluszeit Plattform',
  beschreibung: 'Maximale CAN-Bus Zykluszeit der Plattform.',
  quelle: 'Plattform-Team',
  version: '1.1',
  maxCycleTime: '10ms',
  asil: 'B'
})

CREATE (ext3:InputSpec {
  id: 'EXT-003',
  titel: 'CAN Timeout Handling',
  beschreibung: 'Bei CAN-Timeout >100ms: Fail-Safe aktivieren.',
  quelle: 'Safety-Team',
  version: '4.0',
  timeout: '100ms',
  action: 'Fail-Safe',
  asil: 'C'
});

// =====================================================
// BEZIEHUNGEN: TRACEABILITY
// =====================================================

// Stakeholder -> System Requirements
MATCH (stk1:StakeholderReq {id: 'STK-001'}), (sys1:SystemReq {id: 'SYS-001'})
CREATE (stk1)-[:TRACED_TO]->(sys1);

MATCH (stk1:StakeholderReq {id: 'STK-001'}), (sys2:SystemReq {id: 'SYS-002'})
CREATE (stk1)-[:TRACED_TO]->(sys2);

MATCH (stk2:StakeholderReq {id: 'STK-002'}), (sys3:SystemReq {id: 'SYS-003'})
CREATE (stk2)-[:TRACED_TO]->(sys3);

MATCH (stk2:StakeholderReq {id: 'STK-002'}), (sys4:SystemReq {id: 'SYS-004'})
CREATE (stk2)-[:TRACED_TO]->(sys4);

MATCH (stk3:StakeholderReq {id: 'STK-003'}), (sys5:SystemReq {id: 'SYS-005'})
CREATE (stk3)-[:TRACED_TO]->(sys5);

MATCH (stk4:StakeholderReq {id: 'STK-004'}), (sys6:SystemReq {id: 'SYS-006'})
CREATE (stk4)-[:TRACED_TO]->(sys6);

MATCH (stk4:StakeholderReq {id: 'STK-004'}), (sys7:SystemReq {id: 'SYS-007'})
CREATE (stk4)-[:TRACED_TO]->(sys7);

// System -> Software Requirements
MATCH (sys1:SystemReq {id: 'SYS-001'}), (sw1:SoftwareReq {id: 'SW-001'})
CREATE (sys1)-[:TRACED_TO]->(sw1);

MATCH (sys2:SystemReq {id: 'SYS-002'}), (sw1:SoftwareReq {id: 'SW-001'})
CREATE (sys2)-[:TRACED_TO]->(sw1);

MATCH (sys3:SystemReq {id: 'SYS-003'}), (sw2:SoftwareReq {id: 'SW-002'})
CREATE (sys3)-[:TRACED_TO]->(sw2);

MATCH (sys6:SystemReq {id: 'SYS-006'}), (sw3:SoftwareReq {id: 'SW-003'})
CREATE (sys6)-[:TRACED_TO]->(sw3);

MATCH (sys7:SystemReq {id: 'SYS-007'}), (sw4:SoftwareReq {id: 'SW-004'})
CREATE (sys7)-[:TRACED_TO]->(sw4);

// =====================================================
// BEZIEHUNGEN: VERIFIKATION (Software -> Test)
// ACHTUNG: SW-003 hat KEINEN Test! (Demo-Luecke)
// =====================================================

MATCH (sw1:SoftwareReq {id: 'SW-001'}), (tc1:TestCase {id: 'TC-001'})
CREATE (sw1)-[:VERIFIED_BY]->(tc1);

MATCH (sw1:SoftwareReq {id: 'SW-001'}), (tc2:TestCase {id: 'TC-002'})
CREATE (sw1)-[:VERIFIED_BY]->(tc2);

MATCH (sw2:SoftwareReq {id: 'SW-002'}), (tc3:TestCase {id: 'TC-003'})
CREATE (sw2)-[:VERIFIED_BY]->(tc3);

MATCH (sw4:SoftwareReq {id: 'SW-004'}), (tc4:TestCase {id: 'TC-004'})
CREATE (sw4)-[:VERIFIED_BY]->(tc4);

// SW-003 hat KEINEN Test - das ist die absichtliche Luecke!

// =====================================================
// BEZIEHUNGEN: IMPLEMENTIERUNG (Software -> Komponente)
// =====================================================

MATCH (sw1:SoftwareReq {id: 'SW-001'}), (k2:Komponente {id: 'K-002'})
CREATE (sw1)-[:IMPLEMENTED_IN]->(k2);

MATCH (sw2:SoftwareReq {id: 'SW-002'}), (k3:Komponente {id: 'K-003'})
CREATE (sw2)-[:IMPLEMENTED_IN]->(k3);

MATCH (sw3:SoftwareReq {id: 'SW-003'}), (k4:Komponente {id: 'K-004'})
CREATE (sw3)-[:IMPLEMENTED_IN]->(k4);

MATCH (sw4:SoftwareReq {id: 'SW-004'}), (k4:Komponente {id: 'K-004'})
CREATE (sw4)-[:IMPLEMENTED_IN]->(k4);

// =====================================================
// BEZIEHUNGEN: EXTERNE ABHAENGIGKEITEN (Der blinde Fleck!)
// Das Aussenlicht-Team weiss oft NICHT von diesen!
// =====================================================

// SYS-003 haengt von CAN-Zykluszeit ab (Reaktionszeit!)
MATCH (sys3:SystemReq {id: 'SYS-003'}), (ext2:InputSpec {id: 'EXT-002'})
CREATE (sys3)-[:DEPENDS_ON {
  kritisch: true,
  grund: 'Reaktionszeit 50ms abhaengig von CAN-Zykluszeit 10ms'
}]->(ext2);

// SW-002 haengt von CAN-Resolution ab (Schwellwert!)
MATCH (sw2:SoftwareReq {id: 'SW-002'}), (ext1:InputSpec {id: 'EXT-001'})
CREATE (sw2)-[:DEPENDS_ON {
  kritisch: true,
  grund: 'Schwellwert 5-15N abhaengig von CAN-Resolution 0.1N'
}]->(ext1);

// SW-002 haengt von Timeout-Handling ab (Safety!)
MATCH (sw2:SoftwareReq {id: 'SW-002'}), (ext3:InputSpec {id: 'EXT-003'})
CREATE (sw2)-[:DEPENDS_ON {
  kritisch: true,
  grund: 'Fail-Safe bei CAN-Timeout erforderlich'
}]->(ext3);

// =====================================================
// VALIDIERUNGSREGELN (Regel-Knoten)
// CR-010: Funktions-basiertes Schema
// Taxonomie: ebene (WAS) + wirkung (OUTPUT) + domain (WO)
// =====================================================

// -----------------------------------------------------
// VALIDIERUNG (wirkung: 'Validierung') → Verbesserungsvorschlaege
// -----------------------------------------------------

CREATE (val1:Regel {
  id: 'VAL-001',
  name: 'Traceability-Vollstaendigkeit',
  beschreibung: 'Jedes Software-Requirement muss zu einem System-Requirement zurueckverfolgbar sein',
  ebene: 'Vollstaendigkeit',
  wirkung: 'Validierung',
  cypher: 'MATCH (sw:SoftwareReq) WHERE NOT (:SystemReq)-[:TRACED_TO]->(sw) RETURN sw.id AS id, sw.titel AS name, "SoftwareReq" AS typ',
  schwere: 'fehler',
  domain: 'Traceability',
  standard: 'A-SPICE',
  quelle: 'manuell',
  confidence: 1.0,
  anwendungen: 0,
  treffer: 0,
  aktiv: true,
  erstelltAm: datetime()
})

CREATE (val2:Regel {
  id: 'VAL-002',
  name: 'Test-Coverage',
  beschreibung: 'Jedes Software-Requirement braucht mindestens einen zugeordneten TestCase',
  ebene: 'Vollstaendigkeit',
  wirkung: 'Validierung',
  cypher: 'MATCH (sw:SoftwareReq) WHERE NOT (sw)-[:VERIFIED_BY]->(:TestCase) RETURN sw.id AS id, sw.titel AS name, "SoftwareReq" AS typ',
  schwere: 'fehler',
  domain: 'Traceability',
  standard: 'A-SPICE',
  quelle: 'manuell',
  confidence: 1.0,
  anwendungen: 0,
  treffer: 0,
  aktiv: true,
  erstelltAm: datetime()
})

CREATE (val3:Regel {
  id: 'VAL-003',
  name: 'Vage Zeitangaben',
  beschreibung: 'Requirements duerfen keine unspezifischen Zeitangaben enthalten',
  ebene: 'Inhalt',
  wirkung: 'Validierung',
  cypher: 'MATCH (n) WHERE n.beschreibung IS NOT NULL AND (n.beschreibung =~ "(?i).*\\\\b(schnell|bald|zeitnah|spaeter|demnaechst|umgehend)\\\\b.*") RETURN n.id AS id, COALESCE(n.titel, n.name, n.id) AS name, labels(n)[0] AS typ',
  schwere: 'warnung',
  domain: 'Quality',
  standard: 'ISO 26262',
  quelle: 'manuell',
  confidence: 1.0,
  anwendungen: 0,
  treffer: 0,
  aktiv: true,
  erstelltAm: datetime()
})

CREATE (val4:Regel {
  id: 'VAL-004',
  name: 'Externe Abhaengigkeiten dokumentiert',
  beschreibung: 'System-Requirements mit Schnittstellen-Bezug muessen externe Abhaengigkeiten dokumentieren',
  ebene: 'Struktur',
  wirkung: 'Validierung',
  cypher: 'MATCH (sys:SystemReq) WHERE EXISTS { MATCH (ext:InputSpec) WHERE ext.quelle IS NOT NULL } AND NOT (sys)-[:DEPENDS_ON]->(:InputSpec) RETURN sys.id AS id, sys.titel AS name, "SystemReq" AS typ',
  schwere: 'warnung',
  domain: 'Traceability',
  standard: 'A-SPICE',
  quelle: 'manuell',
  confidence: 1.0,
  anwendungen: 0,
  treffer: 0,
  aktiv: true,
  erstelltAm: datetime()
})

CREATE (val5:Regel {
  id: 'VAL-005',
  name: 'ASIL-Klassifizierung',
  beschreibung: 'Alle System-Requirements muessen eine ASIL-Klassifizierung haben',
  ebene: 'Konsistenz',
  wirkung: 'Validierung',
  cypher: 'MATCH (sys:SystemReq) WHERE sys.asil IS NULL RETURN sys.id AS id, sys.titel AS name, "SystemReq" AS typ',
  schwere: 'fehler',
  domain: 'Safety',
  standard: 'ISO 26262',
  quelle: 'manuell',
  confidence: 1.0,
  anwendungen: 0,
  treffer: 0,
  aktiv: true,
  erstelltAm: datetime()
})

// -----------------------------------------------------
// SCORING (wirkung: 'Scoring') → Kennzahlen
// -----------------------------------------------------

CREATE (sco1:Regel {
  id: 'SCO-001',
  name: 'Testabdeckung',
  beschreibung: 'Prozentsatz der Software-Requirements mit zugeordnetem Test',
  ebene: 'Vollstaendigkeit',
  wirkung: 'Scoring',
  cypher: 'MATCH (sw:SoftwareReq) OPTIONAL MATCH (sw)-[:VERIFIED_BY]->(tc:TestCase) WITH count(DISTINCT sw) AS total, count(DISTINCT tc) AS covered RETURN covered AS wert, total AS von, CASE WHEN total = 0 THEN 0.0 ELSE toFloat(covered)/total END AS score, "%" AS einheit',
  schwellwert: 0.8,
  richtung: 'maximieren',
  schwere: 'info',
  domain: 'Traceability',
  standard: 'A-SPICE',
  quelle: 'manuell',
  confidence: 1.0,
  anwendungen: 0,
  treffer: 0,
  aktiv: true,
  erstelltAm: datetime()
})

// CR-012: Korrigierte Berechnung - zählt SoftwareReqs MIT Trace, nicht SystemReqs
CREATE (sco2:Regel {
  id: 'SCO-002',
  name: 'Traceability-Quote',
  beschreibung: 'Prozentsatz der Software-Requirements mit System-Requirement Verlinkung',
  ebene: 'Vollstaendigkeit',
  wirkung: 'Scoring',
  cypher: 'MATCH (sw:SoftwareReq) WITH sw, exists((:SystemReq)-[:TRACED_TO]->(sw)) AS hasTrace WITH count(sw) AS total, sum(CASE WHEN hasTrace THEN 1 ELSE 0 END) AS traced RETURN traced AS wert, total AS von, CASE WHEN total = 0 THEN 0.0 ELSE toFloat(traced)/total END AS score, "%" AS einheit',
  schwellwert: 1.0,
  richtung: 'maximieren',
  schwere: 'info',
  domain: 'Traceability',
  standard: 'A-SPICE',
  quelle: 'manuell',
  confidence: 1.0,
  anwendungen: 0,
  treffer: 0,
  aktiv: true,
  erstelltAm: datetime()
})

// -----------------------------------------------------
// OPTIMIERUNG (wirkung: 'Optimierung') → Delta-Vorschlaege
// -----------------------------------------------------

CREATE (opt1:Regel {
  id: 'OPT-001',
  name: 'Cross-References minimieren',
  beschreibung: 'Module so strukturieren, dass Abhaengigkeiten zwischen Modulen minimiert werden',
  ebene: 'Struktur',
  wirkung: 'Optimierung',
  cypher_measure: 'MATCH (k1:Komponente)-[d:DEPENDS_ON]->(k2:Komponente) WHERE k1 <> k2 RETURN count(d) AS metricValue',
  cypher: 'MATCH (sw:SoftwareReq)-[:IMPLEMENTED_IN]->(k1:Komponente) MATCH (sw)-[:DEPENDS_ON]->(ext:InputSpec) MATCH (other:SoftwareReq)-[:DEPENDS_ON]->(ext) WHERE other <> sw MATCH (other)-[:IMPLEMENTED_IN]->(k2:Komponente) WHERE k1 <> k2 RETURN sw.id AS kandidat, k1.name AS von, k2.name AS nach, "Verschieben reduziert Cross-Reference" AS grund',
  schwellwert: 10,
  richtung: 'minimieren',
  operator: 'MOVE',
  schwere: 'info',
  domain: 'Architektur',
  standard: 'Intern',
  quelle: 'manuell',
  confidence: 1.0,
  anwendungen: 0,
  treffer: 0,
  aktiv: true,
  erstelltAm: datetime()
})

CREATE (opt2:Regel {
  id: 'OPT-002',
  name: 'Modul-Kohaesion maximieren',
  beschreibung: 'Software-Requirements im selben Modul sollten gemeinsame externe Abhaengigkeiten haben',
  ebene: 'Struktur',
  wirkung: 'Optimierung',
  cypher_measure: 'MATCH (k:Komponente)<-[:IMPLEMENTED_IN]-(sw:SoftwareReq) WITH k, collect(sw) AS reqs UNWIND reqs AS r1 UNWIND reqs AS r2 WHERE id(r1) < id(r2) OPTIONAL MATCH (r1)-[:DEPENDS_ON]->(ext:InputSpec)<-[:DEPENDS_ON]-(r2) WITH k, count(DISTINCT ext) AS sharedDeps, count(*) AS pairs RETURN avg(CASE WHEN pairs = 0 THEN 0 ELSE toFloat(sharedDeps)/pairs END) AS metricValue',
  cypher: 'MATCH (sw:SoftwareReq)-[:IMPLEMENTED_IN]->(k:Komponente) WHERE NOT exists((sw)-[:DEPENDS_ON]->(:InputSpec)) RETURN sw.id AS kandidat, k.name AS von, "anderes Modul" AS nach, "Keine gemeinsamen Abhaengigkeiten mit anderen im Modul" AS grund LIMIT 5',
  schwellwert: 0.5,
  richtung: 'maximieren',
  operator: 'MOVE',
  schwere: 'info',
  domain: 'Architektur',
  standard: 'Intern',
  quelle: 'manuell',
  confidence: 0.8,
  anwendungen: 0,
  treffer: 0,
  aktiv: true,
  erstelltAm: datetime()
});

// =============================================================================
// Project Metadata - Database Identification
// =============================================================================
MERGE (pm:ProjectMeta {id: 'project-meta'})
SET pm.name = 'DataMaturityStages',
    pm.description = 'Requirements Traceability Demo - Automotive AiSE Framework',
    pm.version = '1.0.0',
    pm.domain = 'Automotive/ADAS',
    pm.standards = ['A-SPICE', 'ISO 26262', 'INCOSE'],
    pm.created = datetime('2025-01-01T00:00:00Z'),
    pm.updated = datetime();
