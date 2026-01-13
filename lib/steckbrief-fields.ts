export type FieldType = 'text' | 'textarea' | 'single-image' | 'multi-image';

export interface FieldDefinition {
  key: string;              // Database field name
  type: FieldType;
  label: string;            // German label
  placeholder?: string;
  maxLength?: number;       // For text/textarea
  maxFiles?: number;        // For multi-image
  required?: boolean;
  order: number;            // Display order
  rows?: number;            // For textarea
}

export const STECKBRIEF_FIELDS: FieldDefinition[] = [
  {
    key: 'imageUrl',
    type: 'single-image',
    label: 'Profilbild',
    order: 1,
  },
  {
    key: 'quote',
    type: 'textarea',
    label: 'Lieblingszitat',
    placeholder: 'z.B. "Carpe Diem"',
    maxLength: 500,
    rows: 3,
    order: 2,
  },
  {
    key: 'plansAfter',
    type: 'textarea',
    label: 'Pläne nach dem Abi',
    placeholder: 'Was sind deine Pläne für die Zukunft?',
    maxLength: 1000,
    rows: 4,
    order: 3,
  },
  {
    key: 'memory',
    type: 'textarea',
    label: 'Schönste Erinnerung',
    placeholder: 'Was war deine schönste Erinnerung an die Schulzeit?',
    maxLength: 1000,
    rows: 4,
    order: 4,
  },
  {
    key: 'memoryImages',
    type: 'multi-image',
    label: 'Erinnerungsfotos',
    maxFiles: 3,
    order: 5,
  },
];

// Helper to get field by key
export function getFieldByKey(key: string): FieldDefinition | undefined {
  return STECKBRIEF_FIELDS.find(f => f.key === key);
}

// Get fields sorted by order
export function getSortedFields(): FieldDefinition[] {
  return [...STECKBRIEF_FIELDS].sort((a, b) => a.order - b.order);
}
