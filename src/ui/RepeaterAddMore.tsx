import { t } from '../i18n';
import { repeaterRegistry } from '../data/repeaters';
import { useStore } from '../state/store';
import { btnLink, btnPrimary, btnSecondary } from './classes';

export function RepeaterAddMore({ repeaterId }: { repeaterId: string }) {
  const { state, dispatch } = useStore();
  const locale = state.meta.locale;
  const def = repeaterRegistry.byId.get(repeaterId);
  if (!def) return null;
  const items = state.repeaterItems[repeaterId] ?? [];

  return (
    <div className="question-card rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/40 sm:p-8">
      <h2 className="question-text text-2xl font-light leading-snug tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
        {t(def.addMoreLabel, locale, { n: String(items.length) })}
      </h2>
      {items.length > 0 && (
        <ul className="items mt-7 flex flex-col gap-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50"
            >
              <span className="text-sm text-neutral-700 dark:text-neutral-200">{def.summarize(item, locale)}</span>
              <button className={btnLink} onClick={() => dispatch({ type: 'REPEATER_REMOVE_ITEM', repeaterId, index: i })}>
                {t('ui.remove', locale)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="repeater-actions mt-7 flex gap-3">
        <button className={btnSecondary} onClick={() => dispatch({ type: 'REPEATER_ADD_ANOTHER', repeaterId })}>
          {t('ui.addAnother', locale)}
        </button>
        <button className={btnPrimary} onClick={() => dispatch({ type: 'REPEATER_FINISH', repeaterId })}>
          {t('ui.doneAdding', locale)}
        </button>
      </div>
    </div>
  );
}
