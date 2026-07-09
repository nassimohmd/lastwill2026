import { useState } from 'react';
import type { Question } from '../engine/types';
import { t, type Locale } from '../i18n';
import { RELATIONS, newPersonId } from '../data/relations';
import { useStore } from '../state/store';
import type { Person } from '../engine/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { chip, chipSelected, hint } from './classes';

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
        <Button variant="outline" className="secondary mt-4" onClick={() => setAdding(true)}>
          {t('ui.person.someoneElse', locale)}
        </Button>
      )}
      {adding && (
        <div className="freeform mt-4 flex flex-col gap-4">
          <div className="field">
            <Label className="mb-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t('ui.person.name', locale)}
            </Label>
            <Input type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <Label className="mb-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t('ui.person.relation', locale)}
            </Label>
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
          <Button variant="outline" className="secondary self-start" disabled={!name.trim() || !relation} onClick={addNew}>
            {t('ui.addAnother', locale)}
          </Button>
        </div>
      )}

      {selected.length < min && (
        <p className={`${hint} mt-4`}>{t('ui.personMulti.min', locale, { n: String(min) })}</p>
      )}
      <Button className="primary mt-4" disabled={selected.length < min} onClick={submit}>
        {t('ui.continue', locale)}
      </Button>
    </div>
  );
}
