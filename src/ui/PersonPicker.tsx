import { useState } from 'react';
import type { Question } from '../engine/types';
import { t, type Locale } from '../i18n';
import { RELATIONS, newPersonId } from '../data/relations';
import { useStore } from '../state/store';
import { btnPrimary, chip, chipSelected, hint, inputBase, option } from './classes';

export function PersonPicker({ question }: { question: Question }) {
  const { state, dispatch } = useStore();
  const locale: Locale = state.meta.locale;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<string | null>(null);
  const [address, setAddress] = useState('');

  const pick = (personId: string) => {
    dispatch({ type: 'ANSWER_PERSON', qid: question.id, personId });
  };

  const submitNew = () => {
    if (!name.trim() || !relation) return;
    const id = newPersonId();
    const person = {
      id,
      name: name.trim(),
      relation,
      ...(question.askAddress && address.trim() ? { address: address.trim() } : {}),
    };
    dispatch({ type: 'ANSWER_PERSON', qid: question.id, personId: id, newPerson: person });
  };

  return (
    <div className="person-picker">
      {!adding && (
        <div className="options mt-7 flex flex-col gap-2">
          {state.people.map((p) => (
            <button key={p.id} className={option} onClick={() => pick(p.id)}>
              {p.name} — {t(RELATIONS.find((r) => r.id === p.relation)?.label ?? 'q.relation.other', locale)}
            </button>
          ))}
          <button className={option} onClick={() => setAdding(true)}>
            {t('ui.person.someoneElse', locale)}
          </button>
        </div>
      )}
      {adding && (
        <div className="freeform mt-7 flex flex-col gap-4">
          <div className="field">
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-neutral-500">
              {t('ui.person.name', locale)}
            </label>
            <input className={inputBase} type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="mb-1.5 block text-xs uppercase tracking-widest text-neutral-500">
              {t('ui.person.relation', locale)}
            </label>
            <div className="chip-row flex flex-wrap gap-2">
              {RELATIONS.map((r) => (
                <button
                  key={r.id}
                  className={`${chip} ${relation === r.id ? chipSelected : ''}`}
                  onClick={() => setRelation(r.id)}
                >
                  {t(r.label, locale)}
                </button>
              ))}
            </div>
          </div>
          {question.askAddress && (
            <div className="field">
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-neutral-500">
                {t('ui.person.address', locale)}
              </label>
              <input className={inputBase} type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
              <p className={`${hint} mt-1.5`}>{t('ui.person.addressHint', locale)}</p>
            </div>
          )}
          <button className={`${btnPrimary} self-start`} disabled={!name.trim() || !relation} onClick={submitNew}>
            {t('ui.continue', locale)}
          </button>
        </div>
      )}
    </div>
  );
}
