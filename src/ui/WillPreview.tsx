import { useState } from 'react';
import { clauseBlocks } from '../data/clauses';
import { renderWill, willToText } from '../template/render';
import { t } from '../i18n';
import { useStore } from '../state/store';

export function WillPreview() {
  const { state } = useStore();
  const locale = state.meta.locale;
  const blocks = renderWill(clauseBlocks, state, locale);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const witnessBlock = [
      '',
      `${t('ui.will.testatorSignature', locale)}: ________________________`,
      `${state.answers['personal.full_name'] ?? ''} ${t('ui.will.testator', locale)}`,
      '',
      ...[1, 2].flatMap((n) => [
        `${t('ui.will.witness', locale)} ${n}:`,
        `  ${t('ui.will.witnessName', locale)}: ________________________`,
        `  ${t('ui.will.witnessAddress', locale)}: ________________________`,
        `  ${t('ui.will.witnessOccupation', locale)}: ________________________`,
        `  ${t('ui.will.witnessSignature', locale)}: ________________________`,
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

      <div className="sheet">
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
              {String(state.answers['personal.full_name'] ?? '')} {t('ui.will.testator', locale)}
            </span>
          </div>
        </div>

        <div className="witnesses">
          {[1, 2].map((n) => (
            <div key={n} className="witness">
              <p className="witness-title">{t('ui.will.witness', locale)} {n}</p>
              {(['witnessName', 'witnessAddress', 'witnessOccupation', 'witnessSignature'] as const).map(
                (k) => (
                  <p key={k} className="witness-field">
                    {t(`ui.will.${k}`, locale)}: <span className="rule short" />
                  </p>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
