import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Question } from '../engine/types';
import { t, type Locale } from '../i18n';
import { useStore } from '../state/store';
import { PersonPicker } from './PersonPicker';
import { PersonMultiPicker } from './PersonMultiPicker';
import { SharesPicker } from './SharesPicker';
import {
  btnLink,
  btnPrimary,
  btnSecondary,
  chip,
  chipSelected,
  hint,
  inputBase,
  option,
  optionSelected,
} from './classes';

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
              <motion.button
                key={o.id}
                className={`${option} ${existing === o.id ? optionSelected : ''}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => dispatch({ type: 'ANSWER', qid: question.id, value: o.id, optionId: o.id })}
              >
                {i < 9 && (
                  <span className="option-key mr-2 inline-block min-w-[1.15rem] text-xs tabular-nums text-neutral-400 [@media(hover:none)]:hidden dark:text-neutral-600">
                    {i + 1}
                  </span>
                )}
                {t(o.label, locale)}
              </motion.button>
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
            <button
              className={`${btnPrimary} self-start`}
              disabled={selected.length === 0}
              onClick={() => dispatch({ type: 'ANSWER', qid: question.id, value: selected })}
            >
              {t('ui.continue', locale)}
            </button>
          </div>
        );

      case 'info':
        return (
          <button
            className={`${btnPrimary} mt-7`}
            onClick={() => dispatch({ type: 'ANSWER', qid: question.id, value: true })}
          >
            {t('ui.understood', locale)}
          </button>
        );

      case 'text':
      case 'number':
      case 'date':
      case 'longtext':
        return (
          <div className="freeform mt-7 flex flex-col gap-3">
            {question.type === 'longtext' ? (
              <textarea
                className={inputBase}
                value={text}
                rows={3}
                autoFocus
                onChange={(e) => setText(e.target.value)}
              />
            ) : (
              <input
                className={inputBase}
                type={question.type === 'number' ? 'number' : question.type === 'date' ? 'date' : 'text'}
                value={text}
                autoFocus
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitText()}
              />
            )}
            {question.optional && <p className={hint}>{t('ui.optionalHint', locale)}</p>}
            <button
              className={`${btnPrimary} self-start`}
              disabled={!text.trim() && !question.optional && !skippable}
              onClick={submitText}
            >
              {t('ui.continue', locale)}
            </button>
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
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50"
                  >
                    <span className="text-sm text-neutral-700 dark:text-neutral-200">
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
                  <label className="mb-1.5 block text-xs uppercase tracking-widest text-neutral-500">
                    {t(f.label, locale)}
                  </label>
                  {f.type === 'text' ? (
                    <input
                      className={inputBase}
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
              <button className={btnSecondary} disabled={!draftComplete} onClick={addDraft}>
                {t(question.addMore ?? 'ui.addAnother', locale)}
              </button>
              <button
                className={btnPrimary}
                disabled={items.length === 0 && !draftComplete}
                onClick={() => {
                  const finalItems = draftComplete ? addDraft() : items;
                  if (finalItems.length === 0) return;
                  dispatch({ type: 'ANSWER', qid: question.id, value: finalItems });
                }}
              >
                {t('ui.doneAdding', locale)}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="question-card rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/40 sm:p-8"
      key={question.id}
    >
      <h2 className="question-text text-2xl font-light leading-snug tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
        {t(question.text, locale)}
      </h2>
      {question.help && (
        <p className="help mt-2 text-sm text-neutral-500 dark:text-neutral-400">{t(question.help, locale)}</p>
      )}
      {body()}
      <div className="card-footer mt-11 flex items-center border-t border-neutral-200 pt-4 dark:border-neutral-800/60">
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
    </div>
  );
}
