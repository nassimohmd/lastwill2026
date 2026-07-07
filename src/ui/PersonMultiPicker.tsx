import { useState } from 'react';
import type { Question } from '../engine/types';
import { t, type Locale } from '../i18n';
import { RELATIONS, newPersonId } from '../data/relations';
import { useStore } from '../state/store';
import type { Person } from '../engine/types';

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
    <div className="person-picker">
      <div className="chip-row">
        {allPeople.map((p) => (
          <button
            key={p.id}
            className={`chip ${selected.includes(p.id) ? 'selected' : ''}`}
            onClick={() => toggle(p.id)}
          >
            {p.name} — {t(RELATIONS.find((r) => r.id === p.relation)?.label ?? 'q.relation.other', locale)}
          </button>
        ))}
      </div>

      {!adding && (
        <button className="secondary" onClick={() => setAdding(true)}>
          {t('ui.person.someoneElse', locale)}
        </button>
      )}
      {adding && (
        <div className="freeform">
          <div className="field">
            <label>{t('ui.person.name', locale)}</label>
            <input type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('ui.person.relation', locale)}</label>
            <div className="chip-row">
              {RELATIONS.map((r) => (
                <button
                  key={r.id}
                  className={`chip ${relation === r.id ? 'selected' : ''}`}
                  onClick={() => setRelation(r.id)}
                >
                  {t(r.label, locale)}
                </button>
              ))}
            </div>
          </div>
          <button className="secondary" disabled={!name.trim() || !relation} onClick={addNew}>
            {t('ui.addAnother', locale)}
          </button>
        </div>
      )}

      {selected.length < min && <p className="hint">{t('ui.personMulti.min', locale, { n: String(min) })}</p>}
      <button className="primary" disabled={selected.length < min} onClick={submit}>
        {t('ui.continue', locale)}
      </button>
    </div>
  );
}
