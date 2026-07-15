import { t } from '../i18n';
import { repeaterRegistry } from '../data/repeaters';
import { useStore } from '../state/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { btnLink } from './classes';

export function RepeaterAddMore({ repeaterId }: { repeaterId: string }) {
  const { state, dispatch } = useStore();
  const locale = state.meta.locale;
  const def = repeaterRegistry.byId.get(repeaterId);
  if (!def) return null;
  const items = state.repeaterItems[repeaterId] ?? [];

  return (
    <Card className="question-card gap-0 p-6 sm:p-8">
      <h2 className="question-text text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
        {t(def.addMoreLabel, locale, { n: String(items.length) })}
      </h2>
      {items.length > 0 && (
        <ul className="items mt-7 flex flex-col gap-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className="text-sm text-foreground">{def.summarize(item, locale)}</span>
              <button className={btnLink} onClick={() => dispatch({ type: 'REPEATER_REMOVE_ITEM', repeaterId, index: i })}>
                {t('ui.remove', locale)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="repeater-actions mt-7 flex gap-3">
        <Button variant="outline" className="secondary" onClick={() => dispatch({ type: 'REPEATER_ADD_ANOTHER', repeaterId })}>
          {t('ui.addAnother', locale)}
        </Button>
        <Button className="primary" onClick={() => dispatch({ type: 'REPEATER_FINISH', repeaterId })}>
          {t('ui.doneAdding', locale)}
        </Button>
      </div>
    </Card>
  );
}
