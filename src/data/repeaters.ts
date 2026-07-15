import { buildRepeaterRegistry } from '../engine/repeaters';
import { repeaterDefs } from '../content/load';

export { repeaterDefs };
export const repeaterRegistry = buildRepeaterRegistry(repeaterDefs);
