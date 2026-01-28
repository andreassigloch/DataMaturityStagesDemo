import { Driver } from 'neo4j-driver';

export interface AddRuleParams {
  name: string;
  typ: string;
  cypher: string;
  schwere: 'fehler' | 'warnung';
  standard: string;
}

export interface AddRuleResult {
  success: boolean;
  ruleId: string;
  message: string;
}

export async function addRule(driver: Driver, params: AddRuleParams): Promise<AddRuleResult> {
  const session = driver.session({ defaultAccessMode: 'WRITE' });

  try {
    // Generate unique ID based on timestamp and type
    const ruleId = `REGEL-${params.typ.toUpperCase().substring(0, 3)}-${Date.now()}`;

    await session.run(
      `CREATE (r:Regel {
        id: $id,
        name: $name,
        typ: $typ,
        cypher: $cypher,
        schwere: $schwere,
        standard: $standard,
        aktiv: true,
        erstelltAm: datetime()
      })
      RETURN r`,
      {
        id: ruleId,
        name: params.name,
        typ: params.typ,
        cypher: params.cypher,
        schwere: params.schwere,
        standard: params.standard
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
