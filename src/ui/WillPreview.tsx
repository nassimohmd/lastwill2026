import { useState } from 'react';
import { clauseBlocks } from '../data/clauses';
import { renderWill, willToText } from '../template/render';
import { t, hasLocale, type Locale } from '../i18n';
import { useStore } from '../state/store';
import { SigningInstructions } from './SigningInstructions';
import { getChecklist } from '../template/checklist';

export function WillPreview() {
  const { state } = useStore();
  const locale = state.meta.locale;
  // the operative legal text has its own language choice, independent of
  // the interview locale, and always defaults to English — see the
  // "Will language" toggle below for why (docs/05-roadmap.md Phase 5)
  const [willLocale, setWillLocale] = useState<Locale>('en');
  const blocks = renderWill(clauseBlocks, state, willLocale);
  const checklist = getChecklist(state);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const witnessBlock = [
      '',
      `${t('ui.will.testatorSignature', willLocale)}: ________________________`,
      `${state.answers['personal.full_name'] ?? ''} ${t('ui.will.testator', willLocale)}`,
      '',
      ...[1, 2].flatMap((n) => [
        `${t('ui.will.witness', willLocale)} ${n}:`,
        `  ${t('ui.will.witnessName', willLocale)}: ________________________`,
        `  ${t('ui.will.witnessAddress', willLocale)}: ________________________`,
        `  ${t('ui.will.witnessOccupation', willLocale)}: ________________________`,
        `  ${t('ui.will.witnessSignature', willLocale)}: ________________________`,
        '',
      ]),
    ].join('\n');
    await navigator.clipboard.writeText(willToText(blocks) + '\n' + witnessBlock);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="preview-wrap">
      <div className="preview-actions no-print">
        <button className="primary" onClick={copy}>
          {copied ? t('ui.done.copied', locale) : t('ui.done.copy', locale)}
        </button>
        <button className="secondary" onClick={() => window.print()}>
          {t('ui.done.print', locale)}
        </button>
      </div>

      {hasLocale('ml') && (
        <div className="will-lang-picker no-print">
          <span>{t('ui.will.langLabel', locale)}</span>
          <div className="lang-toggle">
            <button className={willLocale === 'en' ? 'active' : ''} onClick={() => setWillLocale('en')}>
              {t('ui.lang.toggle.en', locale)}
            </button>
            <button className={willLocale === 'ml' ? 'active' : ''} onClick={() => setWillLocale('ml')}>
              {t('ui.lang.toggle.ml', locale)}
            </button>
          </div>
          {willLocale === 'ml' && <p className="hint warning">{t('ui.will.langDraftNotice', locale)}</p>}
        </div>
      )}

      <div className="sheet" lang={willLocale}>
        {blocks.map((b) => {
          if (b.kind === 'title') return <h1 key={b.id} className="will-title">{b.text}</h1>;
          if (b.kind === 'heading') return <h2 key={b.id} className="will-heading">{b.text}</h2>;
          if (b.kind === 'clause')
            return (
              <p key={b.id} className="will-clause">
                <span className="clause-no">{b.number}.</span> {b.text}
              </p>
            );
          return <p key={b.id} className="will-plain">{b.text}</p>;
        })}

        <div className="signature-block">
          <div className="sig-line">
            <span className="rule" />
            <span className="sig-caption">
              {String(state.answers['personal.full_name'] ?? '')} {t('ui.will.testator', willLocale)}
            </span>
          </div>
        </div>

        <div className="witnesses">
          {[1, 2].map((n) => (
            <div key={n} className="witness">
              <p className="witness-title">{t('ui.will.witness', willLocale)} {n}</p>
              {(['witnessName', 'witnessAddress', 'witnessOccupation', 'witnessSignature'] as const).map(
                (k) => (
                  <p key={k} className="witness-field">
                    {t(`ui.will.${k}`, willLocale)}: <span className="rule short" />
                  </p>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="signing-page-wrap">
        <SigningInstructions locale={locale} />
      </div>

      {checklist.length > 0 && (
        <div className="signing-page-wrap">
          <h2>{t('ui.review.checklist.title', locale)}</h2>
          <ul>
            {checklist.map((c) => (
              <li key={c.id}>{t(c.text, locale, c.vars)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
