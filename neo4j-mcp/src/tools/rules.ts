import { Driver } from 'neo4j-driver';

// CR-010: Extended type definitions
export type Wirkung = 'Validierung' | 'Scoring' | 'Optimierung';
export type Ebene = 'Struktur' | 'Inhalt' | 'Konsistenz' | 'Vollstaendigkeit';
export type Domain = 'Traceability' | 'Safety' | 'Quality' | 'Architektur';
export type Schwere = 'fehler' | 'warnung' | 'info';
export type Richtung = 'minimieren' | 'maximieren';
export type Operator = 'SPLIT' | 'MERGE' | 'MOVE' | 'CREATE';
export type Quelle = 'manuell' | 'pattern' | 'feedback' | 'import';

// CR-010: Extended AddRuleParams with functional schema
export interface AddRuleParams {
  name: string;
  beschreibung?: string;
  // Function taxonomy
  ebene: Ebene;
  wirkung: Wirkung;
  // Check logic
  cypher: string;
  cypher_measure?: string;  // For Scoring/Optimierung
  schwellwert?: number;     // Threshold
  richtung?: Richtung;      // minimieren|maximieren
  operator?: Operator;      // SPLIT|MERGE|MOVE|CREATE
  // Context
  schwere: Schwere;
  domain: Domain;
  standard: string;
  // Learning metadata
  quelle?: Quelle;
  confidence?: number;
}

export interface AddRuleResult {
  success: boolean;
  ruleId: string;
  message: string;
}

export async function addRule(driver: Driver, params: AddRuleParams): Promise<AddRuleResult> {
  const session = driver.session({ defaultAccessMode: 'WRITE' });

  try {
    // CR-010: Generate ID based on wirkung type
    const prefix = params.wirkung === 'Validierung' ? 'VAL'
      : params.wirkung === 'Scoring' ? 'SCO'
      : 'OPT';
    const ruleId = `${prefix}-${Date.now()}`;

    await session.run(
      `CREATE (r:Regel {
        id: $id,
        name: $name,
        beschreibung: $beschreibung,
        ebene: $ebene,
        wirkung: $wirkung,
        cypher: $cypher,
        cypher_measure: $cypherMeasure,
        schwellwert: $schwellwert,
        richtung: $richtung,
        operator: $operator,
        schwere: $schwere,
        domain: $domain,
        standard: $standard,
        quelle: $quelle,
        confidence: $confidence,
        anwendungen: 0,
        treffer: 0,
        aktiv: true,
        erstelltAm: datetime()
      })
      RETURN r`,
      {
        id: ruleId,
        name: params.name,
        beschreibung: params.beschreibung || null,
        ebene: params.ebene,
        wirkung: params.wirkung,
        cypher: params.cypher,
        cypherMeasure: params.cypher_measure || null,
        schwellwert: params.schwellwert ?? null,
        richtung: params.richtung || null,
        operator: params.operator || null,
        schwere: params.schwere,
        domain: params.domain,
        standard: params.standard,
        quelle: params.quelle || 'manuell',
        confidence: params.confidence ?? 1.0
      }
    );

    return {
      success: true,
      ruleId,
      message: `Regel "${params.name}" erfolgreich erstellt mit ID ${ruleId}`
    };
  } catch (err) {
    return {
      success: false,
      ruleId: '',
      message: `Fehler beim Erstellen der Regel: ${err}`
    };
  } finally {
    await session.close();
  }
}

export interface ToggleRuleResult {
  success: boolean;
  ruleId: string;
  aktiv: boolean;
  message: string;
}

export async function toggleRule(driver: Driver, ruleId: string, aktiv: boolean): Promise<ToggleRuleResult> {
  const session = driver.session({ defaultAccessMode: 'WRITE' });

  try {
    const result = await session.run(
      `MATCH (r:Regel {id: $ruleId})
       SET r.aktiv = $aktiv
       RETURN r.name AS name`,
      { ruleId, aktiv }
    );

    if (result.records.length === 0) {
      return {
        success: false,
        ruleId,
        aktiv,
        message: `Regel mit ID ${ruleId} nicht gefunden`
      };
    }

    const ruleName = result.records[0].get('name');
    const status = aktiv ? 'aktiviert' : 'deaktiviert';

    return {
      success: true,
      ruleId,
      aktiv,
      message: `Regel "${ruleName}" wurde ${status}`
    };
  } catch (err) {
    return {
      success: false,
      ruleId,
      aktiv,
      message: `Fehler beim Ändern der Regel: ${err}`
    };
  } finally {
    await session.close();
  }
}
