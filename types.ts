
export type FieldType = 'text' | 'checkbox' | 'table' | 'signature' | 'selectionMark';

export type FieldValue = string | 'checked' | 'unchecked' | string[][];

/**
 * Represents a single extracted form element from a document.
 */
export interface ExtractedField {
  field_type: FieldType;
  label: string | null;
  value: FieldValue;
  box: [number, number, number, number];
  page_number: number;
}