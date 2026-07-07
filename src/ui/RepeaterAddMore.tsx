import { t } from '../i18n';
import { repeaterRegistry } from '../data/repeaters';
import { useStore } from '../state/store';

export function RepeaterAddMore({ repeaterId }: { repeaterId: string }) {
  const { state, dispatch } = useStore();
  const locale = state.meta.locale;
  const def = repeaterRegistry.byId.get(repeaterId);
  if (!def) return null;
  const items = state.repeaterItems[repeaterId] ?? [];

  return (
    <div className="question-card">
      <h2 className="question-text">{t(def.addMoreLabel, locale, { n: String(items.length) })}</h2>
      {items.length > 0 && (
        <ul className="items">
          {items.map((item, i) => (
            <li key={i}>
              <span>{def.summarize(item, locale)}</span>
              <button
                className="link"
                onClick={() => dispatch({ type: 'REPEATER_REMOVE_ITEM', repeaterId, index: i })}
              >
                {t('ui.remove', locale)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="repeater-actions">
        <button className="secondary" onClick={() => dispatch({ type: 'REPEATER_ADD_ANOTHER', repeaterId })}>
          {t('ui.addAnother', locale)}
        </button>
        <button className="primary" onClick={() => dispatch({ type: 'REPEATER_FINISH', repeaterId })}>
          {t('ui.doneAdding', locale)}
        </button>
      </div>
    </div>
  );
}
