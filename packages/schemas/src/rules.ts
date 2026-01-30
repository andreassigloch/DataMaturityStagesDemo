/**
 * Rule Schemas - CR-010 Funktions-basierte Taxonomie
 * @author andreas@siglochconsulting
 * @package @maturity/schemas
 */

import { z } from 'zod'

// =============================================================================
// Regel Taxonomie Enums
// =============================================================================

/** Wirkung: Was ist der Output? */
export const WirkungSchema = z.enum(['Validierung', 'Scoring', 'Optimierung'])
export type Wirkung = z.infer<typeof WirkungSchema>

/** Ebene: Was wird geprüft? */
export const EbeneSchema = z.enum(['Struktur', 'Inhalt', 'Konsistenz', 'Vollstaendigkeit'])
export type Ebene = z.infer<typeof EbeneSchema>

/** Domain: Wo gilt die Regel? */
export const DomainSchema = z.enum(['Traceability', 'Safety', 'Quality', 'Architektur'])
export type Domain = z.infer<typeof DomainSchema>

/** Schwere: Wie kritisch ist ein Verstoß? */
export const SchwereSchema = z.enum(['fehler', 'warnung', 'info'])
export type Schwere = z.infer<typeof SchwereSchema>

/** Richtung: Optimierungsrichtung für Scoring */
export const RichtungSchema = z.enum(['minimieren', 'maximieren'])
export type Richtung = z.infer<typeof RichtungSchema>

/** Operator: Optimierungsoperator */
export const OperatorSchema = z.enum(['SPLIT', 'MERGE', 'MOVE', 'CREATE'])
export type Operator = z.infer<typeof OperatorSchema>

/** Standard: Woher kommt die Regel? */
export const StandardSchema = z.enum(['A-SPICE', 'ISO 26262', 'INCOSE', 'ECE', 'Intern'])
export type Standard = z.infer<typeof StandardSchema>

// =============================================================================
// Regel Schema (Complete)
// =============================================================================

export const RegelSchema = z.object({
  id: z.string(),
  name: z.string(),
  beschreibung: z.string().optional(),

  // Funktion
  wirkung: WirkungSchema.optional(),
  ebene: EbeneSchema.optional(),

  // Prüflogik
  cypher: z.string().nullable(),
  cypherMeasure: z.string().nullable().optional(),
  schwellwert: z.number().nullable().optional(),
  richtung: RichtungSchema.nullable().optional(),
  operator: OperatorSchema.nullable().optional(),

  // Kontext
  schwere: SchwereSchema,
  domain: DomainSchema.optional(),
  standard: z.string(),

  // Learning (CR-009)
  quelle: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  anwendungen: z.number().int().min(0).optional(),
  treffer: z.number().int().min(0).optional(),

  // Status
  aktiv: z.boolean(),
  erstelltAm: z.string().datetime().optional(),
})
export type Regel = z.infer<typeof RegelSchema>
