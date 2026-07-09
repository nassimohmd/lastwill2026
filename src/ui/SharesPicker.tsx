import { useState } from 'react';
import type { Question, SharesAnswer } from '../engine/types';
import { t, type Locale } from '../i18n';
import { RELATIONS } from '../data/relations';
import { useStore } from '../state/store';
import { btnPrimary, hint, hintWarning, inputBase, option, optionSelected } from './classes';

export function SharesPicker({ question }: { question: Question }) {
  const { state, dispatch } = useStore();
  const locale: Locale = state.meta.locale;
  const peopleIds = (state.answers[question.peopleSource ?? ''] as string[] | undefined) ?? [];
  const people = peopleIds
    .map((id) => state.people.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const [mode, setMode] = useState<SharesAnswer['mode'] | null>(null);
  const [splits, setSplits] = useState<Record<string, number>>({});
  const [text, setText] = useState('');

  const total = Object.values(splits).reduce((a, b) => a + (isFinite(b) ? b : 0), 0);

  const submit = (value: SharesAnswer) => {
    dispatch({ type: 'ANSWER', qid: question.id, value });
  };

  return (
    <div className="shares-picker mt-7">
      <div className="options flex flex-col gap-2">
        <button className={`${option} ${mode === 'equal' ? optionSelected : ''}`} onClick={() => submit({ mode: 'equal' })}>
          {t('ui.shares.equal', locale)}
        </button>
        <button
          className={`${option} ${mode === 'percentage' ? optionSelected : ''}`}
          onClick={() => setMode('percentage')}
        >
          {t('ui.shares.percentage', locale)}
        </button>
        <button
          className={`${option} ${mode === 'describe' ? optionSelected : ''}`}
          onClick={() => setMode('describe')}
        >
          {t('ui.shares.describe', locale)}
        </button>
      </div>

      {mode === 'percentage' && (
        <div className="freeform mt-5 flex flex-col gap-4">
          {people.map((p) => (
            <div key={p.id} className="field">
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-neutral-500">
                {p.name} — {t(RELATIONS.find((r) => r.id === p.relation)?.label ?? 'q.relation.other', locale)}
              </label>
              <input
                className={inputBase}
                type="number"
                min={0}
                max={100}
                value={splits[p.id] ?? ''}
                onChange={(e) => setSplits({ ...splits, [p.id]: Number(e.target.value) })}
              />
            </div>
          ))}
          <p className={total === 100 ? hint : hintWarning}>
            {t('ui.shares.percentTotal', locale, { n: String(total) })}
            {total !== 100 ? ` — ${t('ui.shares.percentWarning', locale)}` : ''}
          </p>
          <button
            className={`${btnPrimary} self-start`}
            disabled={total !== 100}
            onClick={() => submit({ mode: 'percentage', splits })}
          >
            {t('ui.continue', locale)}
          </button>
        </div>
      )}

      {mode === 'describe' && (
        <div className="freeform mt-5 flex flex-col gap-3">
          <textarea className={inputBase} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          <button
            className={`${btnPrimary} self-start`}
            disabled={!text.trim()}
            onClick={() => submit({ mode: 'describe', text: text.trim() })}
          >
            {t('ui.continue', locale)}
          </button>
        </div>
      )}
    </div>
  );
}
