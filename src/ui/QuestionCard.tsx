import { useEffect, useState } from 'react';
import type { Question } from '../engine/types';
import { t, type Locale } from '../i18n';
import { useStore } from '../state/store';
import { PersonPicker } from './PersonPicker';
import { PersonMultiPicker } from './PersonMultiPicker';
import { SharesPicker } from './SharesPicker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { btnLink, chip, chipSelected, hint, option, optionSelected } from './classes';

interface ItemRecord {
  [field: string]: string;
}

export function QuestionCard({ question }: { question: Question }) {
  const { state, dispatch } = useStore();
  const locale: Locale = state.meta.locale;
  const existing = state.answers[question.id];

  const [text, setText] = useState('');
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [draftItem, setDraftItem] = useState<ItemRecord>({});
  const [selected, setSelected] = useState<string[]>([]);

  // reset local input state whenever the question changes
  useEffect(() => {
    setText(typeof existing === 'string' || typeof existing === 'number' ? String(existing) : '');
    setItems(Array.isArray(existing) && question.type === 'repeater' ? (existing as ItemRecord[]) : []);
    setDraftItem({});
    setSelected(Array.isArray(existing) && question.type === 'multi' ? (existing as string[]) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // number keys 1–9 pick an option directly (the interview is long; this
  // lets keyboard users power through without reaching for the mouse)
  useEffect(() => {
    if (question.type !== 'single' || !question.options) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      const idx = Number(e.key) - 1;
      if (!Number.isInteger(idx) || idx < 0 || idx > 8) return;
      const opt = question.options![idx];
      if (opt) dispatch({ type: 'ANSWER', qid: question.id, value: opt.id, optionId: opt.id });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, dispatch]);

  const skippable = question.skippable !== false;

  const submitText = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      if (question.optional || skippable) dispatch({ type: 'SKIP', qid: question.id });
      return;
    }
    const value = question.type === 'number' ? Number(trimmed) : trimmed;
    dispatch({ type: 'ANSWER', qid: question.id, value });
  };

  const draftComplete = question.fields?.every((f) => (draftItem[f.id] ?? '').trim() !== '') ?? false;

  const addDraft = (): ItemRecord[] => {
    if (!draftComplete) return items;
    const next = [...items, draftItem];
    setItems(next);
    setDraftItem({});
    return next;
  };

  const body = () => {
    switch (question.type) {
      case 'person':
        return <PersonPicker question={question} />;

      case 'personMulti':
        return <PersonMultiPicker question={question} />;

      case 'shares':
        return <SharesPicker question={question} />;

      case 'single':
        return (
          <div className="options mt-7 flex flex-col gap-2">
            {question.options?.map((o, i) => (
              <button
                key={o.id}
                className={`${option} ${existing === o.id ? optionSelected : ''}`}
                onClick={() => dispatch({ type: 'ANSWER', qid: question.id, value: o.id, optionId: o.id })}
              >
                {i < 9 && (
                  <span className="option-key mr-2 inline-block min-w-[1.15rem] text-xs tabular-nums text-muted-foreground [@media(hover:none)]:hidden">
                    {i + 1}
                  </span>
                )}
                {t(o.label, locale)}
              </button>
            ))}
          </div>
        );

      case 'multi':
        return (
          <div className="freeform mt-7 flex flex-col gap-3">
            <div className="chip-row flex flex-wrap gap-2">
              {question.options?.map((o) => (
                <button
                  key={o.id}
                  className={`${chip} ${selected.includes(o.id) ? chipSelected : ''}`}
                  onClick={() =>
                    setSelected((s) => (s.includes(o.id) ? s.filter((x) => x !== o.id) : [...s, o.id]))
                  }
                >
                  {t(o.label, locale)}
                </button>
              ))}
            </div>
            <Button
              className="primary self-start"
              disabled={selected.length === 0}
              onClick={() => dispatch({ type: 'ANSWER', qid: question.id, value: selected })}
            >
              {t('ui.continue', locale)}
            </Button>
          </div>
        );

      case 'info':
        return (
          <Button
            className="primary mt-7"
            onClick={() => dispatch({ type: 'ANSWER', qid: question.id, value: true })}
          >
            {t('ui.understood', locale)}
          </Button>
        );

      case 'text':
      case 'number':
      case 'date':
      case 'longtext':
        return (
          <div className="freeform mt-7 flex flex-col gap-3">
            {question.type === 'longtext' ? (
              <Textarea value={text} rows={3} autoFocus onChange={(e) => setText(e.target.value)} />
            ) : (
              <Input
                type={question.type === 'number' ? 'number' : question.type === 'date' ? 'date' : 'text'}
                value={text}
                autoFocus
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitText()}
              />
            )}
            {question.optional && <p className={hint}>{t('ui.optionalHint', locale)}</p>}
            <Button
              className="primary self-start"
              disabled={!text.trim() && !question.optional && !skippable}
              onClick={submitText}
            >
              {t('ui.continue', locale)}
            </Button>
          </div>
        );

      case 'repeater':
        return (
          <div className="repeater mt-7">
            {items.length > 0 && (
              <ul className="items mb-5 flex flex-col gap-2">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <span className="text-sm text-foreground">
                      {question.fields
                        ?.map((f) => {
                          const v = item[f.id];
                          const l =
                            f.type === 'single'
                              ? t(f.options?.find((o) => o.id === v)?.label ?? '', locale)
                              : v;
                          return l;
                        })
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <button className={btnLink} onClick={() => setItems(items.filter((_, j) => j !== i))}>
                      {t('ui.remove', locale)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="item-form flex flex-col gap-4">
              {question.fields?.map((f) => (
                <div key={f.id} className="field">
                  <Label className="mb-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {t(f.label, locale)}
                  </Label>
                  {f.type === 'text' ? (
                    <Input
                      type="text"
                      value={draftItem[f.id] ?? ''}
                      onChange={(e) => setDraftItem({ ...draftItem, [f.id]: e.target.value })}
                    />
                  ) : (
                    <div className="chip-row flex flex-wrap gap-2">
                      {f.options?.map((o) => (
                        <button
                          key={o.id}
                          className={`${chip} ${draftItem[f.id] === o.id ? chipSelected : ''}`}
                          onClick={() => setDraftItem({ ...draftItem, [f.id]: o.id })}
                        >
                          {t(o.label, locale)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="repeater-actions mt-7 flex gap-3">
              <Button variant="outline" className="secondary" disabled={!draftComplete} onClick={addDraft}>
                {t(question.addMore ?? 'ui.addAnother', locale)}
              </Button>
              <Button
                className="primary"
                disabled={items.length === 0 && !draftComplete}
                onClick={() => {
                  const finalItems = draftComplete ? addDraft() : items;
                  if (finalItems.length === 0) return;
                  dispatch({ type: 'ANSWER', qid: question.id, value: finalItems });
                }}
              >
                {t('ui.doneAdding', locale)}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="question-card gap-0 p-6 sm:p-8" key={question.id}>
      <h2 className="question-text text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
        {t(question.text, locale)}
      </h2>
      {question.help && <p className="help mt-2 text-sm text-muted-foreground">{t(question.help, locale)}</p>}
      {body()}
      <div className="card-footer mt-11 flex items-center border-t border-border pt-4">
        {state.history.length > 0 && (
          <button className={btnLink} onClick={() => dispatch({ type: 'BACK' })}>
            ← {t('ui.back', locale)}
          </button>
        )}
        <span className="flex-1" />
        {/* info cards already advance via "Understood" — a Skip link beside it
            is a second CTA for the same action */}
        {skippable && question.type !== 'info' && (
          <button className={btnLink} onClick={() => dispatch({ type: 'SKIP', qid: question.id })}>
            {t('ui.skip', locale)} →
          </button>
        )}
      </div>
    </Card>
  );
}
