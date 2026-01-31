/**
 * Admin Tools - Database Setup
 * @author andreas@siglochconsulting
 */

import { Driver } from 'neo4j-driver';

interface ProjectMetaParams {
  name: string;
  description?: string;
  domain?: string;
  version?: string;
  standards?: string[];
}

export async function setProjectMeta(driver: Driver, params: ProjectMetaParams) {
  const session = driver.session({ defaultAccessMode: 'WRITE' });

  try {
    const result = await session.run(
      `MERGE (pm:ProjectMeta {id: 'project-meta'})
       SET pm.name = $name,
           pm.description = $description,
           pm.domain = $domain,
           pm.version = $version,
           pm.standards = $standards,
           pm.updated = datetime()
       RETURN pm.name AS name, pm.domain AS domain`,
      {
        name: params.name,
        description: params.description || '',
        domain: params.domain || '',
        version: params.version || '1.0.0',
        standards: params.standards || []
      }
    );

    const record = result.records[0];
    return {
      success: true,
      project: {
        name: record?.get('name'),
        domain: record?.get('domain')
      }
    };
  } finally {
    await session.close();
  }
}
