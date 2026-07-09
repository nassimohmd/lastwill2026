import { useState } from 'react';
import type { Question } from '../engine/types';
import { t, type Locale } from '../i18n';
import { RELATIONS, newPersonId } from '../data/relations';
import { useStore } from '../state/store';
import type { Person } from '../engine/types';
import { btnPrimary, btnSecondary, chip, chipSelected, hint, inputBase } from './classes';

export function PersonMultiPicker({ question }: { question: Question }) {
  const { state, dispatch } = useStore();
  const locale: Locale = state.meta.locale;
  const min = question.minPeople ?? 2;

  const [selected, setSelected] = useState<string[]>([]);
  const [newPeople, setNewPeople] = useState<Person[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<string | null>(null);

  const allPeople = [...state.people, ...newPeople];

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const addNew = () => {
    if (!name.trim() || !relation) return;
    const id = newPersonId();
    const person: Person = { id, name: name.trim(), relation };
    setNewPeople((p) => [...p, person]);
    setSelected((s) => [...s, id]);
    setName('');
    setRelation(null);
    setAdding(false);
  };

  const submit = () => {
    if (selected.length < min) return;
    dispatch({
      type: 'ANSWER_PEOPLE',
      qid: question.id,
      personIds: selected,
      newPeople: newPeople.filter((p) => selected.includes(p.id)),
    });
  };

  return (
    <div className="person-picker mt-7">
      <div className="chip-row flex flex-wrap gap-2">
        {allPeople.map((p) => (
          <button
            key={p.id}
            className={`${chip} ${selected.includes(p.id) ? chipSelected : ''}`}
            onClick={() => toggle(p.id)}
          >
            {p.name} — {t(RELATIONS.find((r) => r.id === p.relation)?.label ?? 'q.relation.other', locale)}
          </button>
        ))}
      </div>

      {!adding && (
        <button className={`${btnSecondary} mt-4`} onClick={() => setAdding(true)}>
          {t('ui.person.someoneElse', locale)}
        </button>
      )}
      {adding && (
        <div className="freeform mt-4 flex flex-col gap-4">
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
          <button className={`${btnSecondary} self-start`} disabled={!name.trim() || !relation} onClick={addNew}>
            {t('ui.addAnother', locale)}
          </button>
        </div>
      )}

      {selected.length < min && (
        <p className={`${hint} mt-4`}>{t('ui.personMulti.min', locale, { n: String(min) })}</p>
      )}
      <button className={`${btnPrimary} mt-4`} disabled={selected.length < min} onClick={submit}>
        {t('ui.continue', locale)}
      </button>
    </div>
  );
}
