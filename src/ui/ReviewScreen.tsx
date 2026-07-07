import { t } from '../i18n';
import { useStore } from '../state/store';
import { sections, chapters } from '../data/graph';
import { getWarnings, getChecklist } from '../template/checklist';
import { sectionSummary } from '../template/summaries';

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
      <h2>{t('ui.review.title', locale)}</h2>
      <p className="lead-text">{t('ui.review.lead', locale)}</p>

      {warnings.length > 0 && (
        <div className="warnings">
          {warnings.map((w) => (
            <div key={w.id} className={`warning-card ${w.severity}`}>
              <p>{t(w.text, locale)}</p>
              {w.jumpTo && (
                <button className="link" onClick={() => dispatch({ type: 'GOTO', qid: w.jumpTo! })}>
                  {t('ui.review.fix', locale)} →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ul className="review-sections">
        {sections.map((s) => {
          const status = sectionStatus(state, s.order[0]);
          const chapter = chapters.find((c) => c.id === s.chapter);
          const summary = status === 'done' ? sectionSummary(s.id, state, locale) : null;
          return (
            <li key={s.id} className="review-section-row">
              <div>
                <span className="review-section-title">{t(s.title, locale)}</span>
                {summary ? (
                  <span className="review-section-summary">{summary}</span>
                ) : (
                  <span className="review-section-chapter">{chapter ? t(chapter.title, locale) : ''}</span>
                )}
              </div>
              <span className={`status-pill ${status}`}>
                {t(status === 'done' ? 'ui.review.section.done' : 'ui.review.section.skipped', locale)}
              </span>
              <button className="link" onClick={() => dispatch({ type: 'GOTO', qid: s.order[0] })}>
                {t('ui.review.section.review', locale)}
              </button>
            </li>
          );
        })}
      </ul>

      {checklist.length > 0 && (
        <div className="checklist">
          <h3>{t('ui.review.checklist.title', locale)}</h3>
          <p className="lead-text">{t('ui.review.checklist.lead', locale)}</p>
          <ul>
            {checklist.map((c) => (
              <li key={c.id}>{t(c.text, locale, c.vars)}</li>
            ))}
          </ul>
        </div>
      )}

      <button className="primary big" onClick={onGenerate}>
        {t('ui.review.generate', locale)}
      </button>
    </div>
  );
}
