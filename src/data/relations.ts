/** The relation choices offered when adding someone new via SF-PERSON. */
export const RELATIONS: { id: string; label: string }[] = [
  { id: 'wife', label: 'q.relation.wife' },
  { id: 'husband', label: 'q.relation.husband' },
  { id: 'son', label: 'q.relation.son' },
  { id: 'daughter', label: 'q.relation.daughter' },
  { id: 'father', label: 'q.relation.father' },
  { id: 'mother', label: 'q.relation.mother' },
  { id: 'brother', label: 'q.relation.brother' },
  { id: 'sister', label: 'q.relation.sister' },
  { id: 'grandchild', label: 'q.relation.grandchild' },
  { id: 'other_relative', label: 'q.relation.other_relative' },
  { id: 'friend', label: 'q.relation.friend' },
  { id: 'other', label: 'q.relation.other' },
];

export function relationLabel(relation: string): string {
  return RELATIONS.find((r) => r.id === relation)?.label ?? 'q.relation.other';
}

/** Generates a client-side id for a newly added registry person. */
export function newPersonId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return 'p-' + c.randomUUID();
  return 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
