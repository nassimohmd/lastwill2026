export { RELATIONS, relationLabel } from '../content/load';

/** Generates a client-side id for a newly added registry person. */
export function newPersonId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return 'p-' + c.randomUUID();
  return 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
