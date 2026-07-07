import type { Question } from '../engine/types';

// Chapter 6 — Digital Life (docs/03-question-flows.md, DA1–DA9)
export const digitalQuestions: Question[] = [
  {
    id: 'digital.gate',
    section: 'digital',
    type: 'single',
    text: 'q.digital.gate',
    gate: true,
    options: [
      { id: 'yes', label: 'q.digital.gate.opt.yes', next: 'digital.subs' },
      { id: 'no', label: 'q.digital.gate.opt.no' },
    ],
    next: 'residuary.primary',
  },

  {
    id: 'digital.subs',
    section: 'digital',
    type: 'single',
    text: 'q.digital.subs',
    options: [
      { id: 'cancel_all', label: 'q.digital.subs.opt.cancel_all' },
      { id: 'cancel_with_exceptions', label: 'q.digital.subs.opt.cancel_with_exceptions', next: 'digital.subs.exceptions' },
      { id: 'family_decides', label: 'q.digital.subs.opt.family_decides' },
    ],
    next: 'digital.statements',
  },
  { id: 'digital.subs.exceptions', section: 'digital', type: 'longtext', text: 'q.digital.subs.exceptions', optional: true, next: 'digital.statements' },

  {
    id: 'digital.statements',
    section: 'digital',
    type: 'single',
    text: 'q.digital.statements',
    help: 'q.digital.statements.help',
    options: [
      { id: 'full_consent', label: 'q.digital.statements.opt.full_consent' },
      { id: 'narrow_consent', label: 'q.digital.statements.opt.narrow_consent' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'digital.social',
  },

  {
    id: 'digital.social',
    section: 'digital',
    type: 'single',
    text: 'q.digital.social',
    options: [
      { id: 'delete_all', label: 'q.digital.social.opt.delete_all' },
      { id: 'memorialise', label: 'q.digital.social.opt.memorialise' },
      { id: 'archive_then_delete', label: 'q.digital.social.opt.archive_then_delete', next: 'digital.social.recipient' },
      { id: 'leave_as_is', label: 'q.digital.social.opt.leave_as_is' },
      { id: 'per_platform', label: 'q.digital.social.opt.per_platform', next: 'digital.social.notes' },
    ],
    next: 'digital.email',
  },
  { id: 'digital.social.recipient', section: 'digital', type: 'person', text: 'q.sf.beneficiary.person', next: 'digital.email' },
  { id: 'digital.social.notes', section: 'digital', type: 'longtext', text: 'q.digital.social.notes', next: 'digital.email' },

  {
    id: 'digital.email',
    section: 'digital',
    type: 'single',
    text: 'q.digital.email',
    options: [
      { id: 'keep_briefly', label: 'q.digital.email.opt.keep_briefly' },
      { id: 'delete', label: 'q.digital.email.opt.delete' },
      { id: 'hand_over', label: 'q.digital.email.opt.hand_over', next: 'digital.email.recipient' },
      { id: 'leave_as_is', label: 'q.digital.email.opt.leave_as_is' },
    ],
    next: 'digital.storage',
  },
  { id: 'digital.email.recipient', section: 'digital', type: 'person', text: 'q.sf.beneficiary.person', next: 'digital.storage' },

  {
    id: 'digital.storage',
    section: 'digital',
    type: 'single',
    text: 'q.digital.storage',
    options: [
      { id: 'trusted_review', label: 'q.digital.storage.opt.trusted_review', next: 'digital.storage.reviewer' },
      { id: 'copy_for_family', label: 'q.digital.storage.opt.copy_for_family', next: 'digital.storage.recipient' },
      { id: 'delete_all', label: 'q.digital.storage.opt.delete_all' },
      { id: 'family_decides', label: 'q.digital.storage.opt.family_decides' },
    ],
    next: 'digital.photos',
  },
  { id: 'digital.storage.reviewer', section: 'digital', type: 'person', text: 'q.sf.beneficiary.person', next: 'digital.photos' },
  { id: 'digital.storage.recipient', section: 'digital', type: 'person', text: 'q.sf.beneficiary.person', next: 'digital.photos' },

  {
    id: 'digital.photos',
    section: 'digital',
    type: 'single',
    text: 'q.digital.photos',
    options: [
      { id: 'share_with_family', label: 'q.digital.photos.opt.share_with_family' },
      { id: 'one_person', label: 'q.digital.photos.opt.one_person', next: 'digital.photos.recipient' },
      { id: 'review_first', label: 'q.digital.photos.opt.review_first', next: 'digital.photos.reviewer' },
      { id: 'delete_all', label: 'q.digital.photos.opt.delete_all' },
      { id: 'family_decides', label: 'q.digital.photos.opt.family_decides' },
    ],
    next: 'digital.backup',
  },
  { id: 'digital.photos.recipient', section: 'digital', type: 'person', text: 'q.sf.beneficiary.person', next: 'digital.backup' },
  { id: 'digital.photos.reviewer', section: 'digital', type: 'person', text: 'q.sf.beneficiary.person', next: 'digital.backup' },

  {
    id: 'digital.backup',
    section: 'digital',
    type: 'multi',
    text: 'q.digital.backup',
    options: [
      { id: 'call_history', label: 'q.digital.backup.opt.call_history' },
      { id: 'sms', label: 'q.digital.backup.opt.sms' },
      { id: 'emails', label: 'q.digital.backup.opt.emails' },
      { id: 'documents', label: 'q.digital.backup.opt.documents' },
      { id: 'contacts', label: 'q.digital.backup.opt.contacts' },
    ],
    next: 'digital.backup.recipient',
  },
  { id: 'digital.backup.recipient', section: 'digital', type: 'person', text: 'q.digital.backup.recipient', next: 'digital.access' },

  {
    id: 'digital.access',
    section: 'digital',
    type: 'single',
    text: 'q.digital.access',
    help: 'q.digital.access.help',
    options: [
      { id: 'sealed_envelope', label: 'q.invest.item.crypto_access.opt.sealed_envelope' },
      { id: 'password_manager', label: 'q.invest.item.crypto_access.opt.password_manager' },
      { id: 'trusted_person', label: 'q.invest.item.crypto_access.opt.trusted_person', next: 'digital.access.person' },
      { id: 'not_set', label: 'q.invest.item.crypto_access.opt.not_set' },
    ],
    next: 'residuary.primary',
  },
  { id: 'digital.access.person', section: 'digital', type: 'person', text: 'q.sf.beneficiary.person', next: 'residuary.primary' },
];
