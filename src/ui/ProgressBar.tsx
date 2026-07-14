import { sections, chapters } from '../data/graph';
import { t } from '../i18n';
import { useStore } from '../state/store';
import { repeaterIdFromAddMoreScreen } from '../engine/repeaters';
import { repeaterRegistry } from '../data/repeaters';

export function ProgressBar() {
  const { state } = useStore();
  const locale = state.meta.locale;
  // an add-more sentinel isn't a real question id — locate progress via the
  // repeater's entry question instead, so the bar doesn't blank out mid-repeater
  const repeaterId = state.currentQuestionId ? repeaterIdFromAddMoreScreen(state.currentQuestionId) : null;
  const current = repeaterId ? repeaterRegistry.byId.get(repeaterId)?.entryId ?? null : state.currentQuestionId;

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

  // position within the current chapter, for the "(2/6)" chapter counter
  const chapterSections = currentSection ? sections.filter((s) => s.chapter === currentSection.chapter) : [];
  const chapterPos = currentSection ? chapterSections.indexOf(currentSection) + 1 : 0;

  return (
    <div className="progress mb-8">
      <div className="progress-labels mb-2.5 flex items-baseline justify-between gap-4">
        <span className="chapter-label text-[11px] uppercase tracking-wider text-muted-foreground">
          {chapter ? t(chapter.title, locale) : ''}
          {chapterSections.length > 1 ? ` (${chapterPos}/${chapterSections.length})` : ''}
          {currentSection ? ` — ${t(currentSection.title, locale)}` : ''}
        </span>
        {currentSection && (
          <span className="progress-count whitespace-nowrap text-[11px] tracking-wide text-muted-foreground/80">
            {currentSectionIdx + 1} / {sections.length}
          </span>
        )}
      </div>
      <div className="progress-track flex gap-2.5">
        {chapters.map((c) => {
          const secs = sections.filter((s) => s.chapter === c.id);
          if (secs.length === 0) return null;
          const isCurrent = chapter?.id === c.id;
          return (
            <div
              key={c.id}
              className={`progress-chapter flex gap-[3px] ${isCurrent ? 'current' : ''}`}
              style={{ flexGrow: secs.length }}
            >
              {secs.map((s) => {
                const i = sections.indexOf(s);
                const pct =
                  i < currentSectionIdx ? 100 : i === currentSectionIdx ? Math.round(withinSection * 100) : 0;
                return (
                  <div
                    key={s.id}
                    className={`progress-seg h-[3px] flex-1 overflow-hidden rounded-sm ${isCurrent ? 'bg-accent' : 'bg-muted'}`}
                  >
                    <div className="progress-fill h-full bg-foreground" style={{ width: `${pct}%` }} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
