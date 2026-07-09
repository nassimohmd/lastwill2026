import { ChevronRight } from 'lucide-react';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { sections, chapters } from '../data/graph';
import { getWarnings, getChecklist } from '../template/checklist';
import { sectionSummary } from '../template/summaries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { btnLink } from './classes';

function sectionStatus(state: ReturnType<typeof useStore>['state'], gateId: string): 'done' | 'skipped' {
  if (state.skipped.includes(gateId)) return 'skipped';
  const v = state.answers[gateId];
  if (v === undefined) return 'skipped';
  return v === 'no' ? 'skipped' : 'done';
}

export function ReviewScreen({ onGenerate }: { onGenerate: () => void }) {
  const { state, dispatch } = useStore();
  const locale = state.meta.locale;
  const warnings = getWarnings(state);
  const checklist = getChecklist(state);

  return (
    <div className="review">
      <h2 className="text-2xl font-light tracking-tight text-foreground">{t('ui.review.title', locale)}</h2>
      <p className="lead-text mt-1.5 mb-7 text-sm text-muted-foreground">{t('ui.review.lead', locale)}</p>

      {warnings.length > 0 && (
        <div className="warnings mb-8 flex flex-col gap-2.5">
          {warnings.map((w) => (
            <Alert key={w.id} variant={w.severity === 'strong' ? 'destructive' : 'default'} className={`warning-card ${w.severity}`}>
              <AlertDescription>
                <p>{t(w.text, locale)}</p>
                {w.jumpTo && (
                  <button className={btnLink} onClick={() => dispatch({ type: 'GOTO', qid: w.jumpTo! })}>
                    {t('ui.review.fix', locale)} →
                  </button>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <ul className="review-sections mb-9">
        {sections.map((s) => {
          const status = sectionStatus(state, s.order[0]);
          const chapter = chapters.find((c) => c.id === s.chapter);
          const summary = status === 'done' ? sectionSummary(s.id, state, locale) : null;
          return (
            <li
              key={s.id}
              className="review-section-row group flex items-center gap-3 border-b border-border py-3.5 last:border-b-0"
            >
              <div className="flex flex-1 flex-col">
                <span className="review-section-title text-[15px] text-foreground">{t(s.title, locale)}</span>
                {summary ? (
                  <span className="review-section-summary mt-0.5 text-sm text-muted-foreground">{summary}</span>
                ) : (
                  <span className="review-section-chapter mt-0.5 text-xs uppercase tracking-wider text-muted-foreground/70">
                    {chapter ? t(chapter.title, locale) : ''}
                  </span>
                )}
              </div>
              <Badge
                variant={status === 'done' ? 'default' : 'outline'}
                className={`status-pill ${status === 'done' ? 'done' : ''}`}
              >
                {t(status === 'done' ? 'ui.review.section.done' : 'ui.review.section.skipped', locale)}
              </Badge>
              <button
                className={`${btnLink} flex items-center gap-1`}
                onClick={() => dispatch({ type: 'GOTO', qid: s.order[0] })}
              >
                {t('ui.review.section.review', locale)}
                <ChevronRight
                  className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {checklist.length > 0 && (
        <div className="checklist mb-9">
          <h3 className="text-lg font-light text-foreground">{t('ui.review.checklist.title', locale)}</h3>
          <p className="lead-text mt-1 mb-3 text-sm text-muted-foreground">{t('ui.review.checklist.lead', locale)}</p>
          <ul className="list-disc pl-5">
            {checklist.map((c) => (
              <li key={c.id} className="mb-2 text-sm text-muted-foreground">
                {t(c.text, locale, c.vars)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button size="lg" className="primary big px-8" onClick={onGenerate}>
        {t('ui.review.generate', locale)}
      </Button>
    </div>
  );
}
