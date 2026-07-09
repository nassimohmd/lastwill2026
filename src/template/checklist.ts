import type { AppState } from '../engine/types';
import { generationBlockers } from './render';

/**
 * Personal to-dos derived from the interview answers — things a will alone
 * can't finish (nominations, legacy-contact setup, telling people where the
 * will is). Computed fresh from state, not collected as a side-channel
 * during the interview, so it stays correct across edits/branch changes.
 * `text` is an i18n key; `vars` are its {placeholders}.
 */
export interface ChecklistItem {
  id: string;
  text: string;
  vars?: Record<string, string>;
}

/** Review-screen warnings. `strong` ones are shown with emphasis. */
export interface ReviewWarning {
  id: string;
  severity: 'strong' | 'info';
  text: string;
  jumpTo?: string;
}

function asArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

export function getWarnings(state: AppState): ReviewWarning[] {
  const a = state.answers;
  const warnings: ReviewWarning[] = [];

  // surfaced first — these block will generation outright, so the user
  // should see and fix them here rather than discovering it after clicking
  // "Generate my will"
  const blockers = generationBlockers(state);
  if (blockers.includes('sound_mind')) {
    warnings.push({
      id: 'sound-mind-unconfirmed',
      severity: 'strong',
      text: 'ui.blocked.soundMind',
      jumpTo: 'personal.sound_mind',
    });
  }
  if (blockers.includes('underage')) {
    warnings.push({ id: 'underage', severity: 'strong', text: 'ui.blocked.underage' });
  }

  if (!a['residuary.primary']) {
    warnings.push({ id: 'no-residuary', severity: 'strong', text: 'ui.warning.noResiduary', jumpTo: 'residuary.primary' });
  }
  if (a['personal.religion'] === 'muslim') {
    warnings.push({ id: 'muslim-third', severity: 'info', text: 'ui.warning.muslimThird' });
  }
  return warnings;
}

export function getChecklist(state: AppState): ChecklistItem[] {
  const a = state.answers;
  const items: ChecklistItem[] = [];

  for (const acc of asArray(a['bank.accounts'])) {
    if (acc.nomination === 'different' || acc.nomination === 'none') {
      items.push({
        id: `bank-nom-${acc.bank_name}`,
        text: 'ui.checklist.nomination',
        vars: { asset: String(acc.bank_name ?? 'this account') },
      });
    }
  }
  for (const inv of asArray(a['invest.items'])) {
    if (inv.type !== 'insurance' && (inv.nomination === 'different' || inv.nomination === 'none')) {
      items.push({
        id: `invest-nom-${inv.desc}`,
        text: 'ui.checklist.nomination',
        vars: { asset: String(inv.desc ?? 'this investment') },
      });
    }
    if (inv.type === 'crypto' && inv.crypto_access === 'not_set') {
      items.push({
        id: `invest-crypto-${inv.desc}`,
        text: 'ui.checklist.accessNote',
        vars: { asset: String(inv.desc ?? 'your crypto asset') },
      });
    }
  }

  if (a['digital.gate'] === 'yes' && a['digital.access'] === 'not_set') {
    items.push({ id: 'digital-access', text: 'ui.checklist.digitalAccess' });
  }
  if (a['digital.gate'] === 'yes' && a['digital.social'] !== undefined) {
    items.push({ id: 'digital-legacy-tools', text: 'ui.checklist.legacyTools' });
  }
  if (a['executors.informed'] === 'no') {
    items.push({ id: 'tell-executor', text: 'ui.checklist.tellExecutor' });
  }
  if ((a['organ.gate'] === 'yes_any' || a['organ.gate'] === 'yes_specific') && a['organ.registered'] === 'no') {
    items.push({ id: 'organ-register', text: 'ui.checklist.organRegister' });
  }
  if (a['funeral.method'] === 'donate_science') {
    items.push({ id: 'body-donation', text: 'ui.checklist.bodyDonation' });
  }

  return items;
}
