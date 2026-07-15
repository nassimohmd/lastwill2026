import { useState } from 'react';
import { clauseBlocks } from '../data/clauses';
import { renderWill, willToText } from '../template/render';
import { t, hasLocale, type Locale } from '../i18n';
import { useStore } from '../state/store';
import { SigningInstructions } from './SigningInstructions';
import { getChecklist } from '../template/checklist';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { hintWarning } from './classes';

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
      <div className="preview-actions no-print mb-6 flex gap-3">
        <Button className="primary" onClick={copy}>
          {copied ? t('ui.done.copied', locale) : t('ui.done.copy', locale)}
        </Button>
        <Button variant="outline" className="secondary" onClick={() => window.print()}>
          {t('ui.done.print', locale)}
        </Button>
      </div>

      {hasLocale('ml') && (
        <div className="will-lang-picker no-print mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{t('ui.will.langLabel', locale)}</span>
          <ToggleGroup
            type="single"
            spacing={1}
            value={willLocale}
            onValueChange={(value) => value && setWillLocale(value as Locale)}
            className="lang-toggle rounded-full border border-border bg-muted/40 p-1"
          >
            <ToggleGroupItem
              value="en"
              className="rounded-full px-3 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              {t('ui.lang.toggle.en', locale)}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="ml"
              className="rounded-full px-3 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              {t('ui.lang.toggle.ml', locale)}
            </ToggleGroupItem>
          </ToggleGroup>
          {willLocale === 'ml' && (
            <p className={`${hintWarning} basis-full italic`}>{t('ui.will.langDraftNotice', locale)}</p>
          )}
        </div>
      )}

      <div className="sheet rounded-lg border border-border px-6 py-10 sm:px-12 sm:py-14" lang={willLocale}>
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

      <div className="signing-page-wrap mt-9 border-t border-dashed border-border pt-9">
        <SigningInstructions locale={locale} />
      </div>

      {checklist.length > 0 && (
        <div className="signing-page-wrap mt-9 border-t border-dashed border-border pt-9">
          <h2 className="text-lg font-semibold text-foreground">{t('ui.review.checklist.title', locale)}</h2>
          <ul className="mt-3 list-disc pl-5">
            {checklist.map((c) => (
              <li key={c.id} className="mb-2 text-sm text-muted-foreground">
                {t(c.text, locale, c.vars)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
