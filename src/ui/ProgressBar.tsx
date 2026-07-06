import { sections, chapters } from '../data/graph';
import { t } from '../i18n';
import { useStore } from '../state/store';

export function ProgressBar() {
  const { state } = useStore();
  const locale = state.meta.locale;
  const current = state.currentQuestionId;

  const currentSectionIdx = current
    ? sections.findIndex((s) => s.order.includes(current))
    : sections.length; // finished

  const currentSection = sections[currentSectionIdx];
  const chapter = currentSection
    ? chapters.find((c) => c.id === currentSection.chapter)
    : null;

  const withinSection =
    current && currentSection
      ? (currentSection.order.indexOf(current) + 1) / currentSection.order.length
      : 1;

  return (
    <div className="progress">
      <div className="progress-labels">
        <span className="chapter-label">
          {chapter ? t(chapter.title, locale) : ''}
          {currentSection ? ` — ${t(currentSection.title, locale)}` : ''}
        </span>
      </div>
      <div className="progress-track">
        {sections.map((s, i) => (
          <div key={s.id} className="progress-seg">
            <div
              className="progress-fill"
              style={{
                width:
                  i < currentSectionIdx
                    ? '100%'
                    : i === currentSectionIdx
                      ? `${Math.round(withinSection * 100)}%`
                      : '0%',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
