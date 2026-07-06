import { useEffect, useState } from 'react';
import type { Question } from '../engine/types';
import { t, type Locale } from '../i18n';
import { useStore } from '../state/store';

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

  // reset local input state whenever the question changes
  useEffect(() => {
    setText(typeof existing === 'string' || typeof existing === 'number' ? String(existing) : '');
    setItems(Array.isArray(existing) ? (existing as ItemRecord[]) : []);
    setDraftItem({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

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

  const draftComplete =
    question.fields?.every((f) => (draftItem[f.id] ?? '').trim() !== '') ?? false;

  const addDraft = (): ItemRecord[] => {
    if (!draftComplete) return items;
    const next = [...items, draftItem];
    setItems(next);
    setDraftItem({});
    return next;
  };

  const body = () => {
    switch (question.type) {
      case 'single':
        return (
          <div className="options">
            {question.options?.map((o) => (
              <button
                key={o.id}
                className={`option ${existing === o.id ? 'selected' : ''}`}
                onClick={() =>
                  dispatch({ type: 'ANSWER', qid: question.id, value: o.id, optionId: o.id })
                }
              >
                {t(o.label, locale)}
              </button>
            ))}
          </div>
        );

      case 'info':
        return (
          <button
            className="primary"
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
          <div className="freeform">
            {question.type === 'longtext' ? (
              <textarea
                value={text}
                rows={3}
                autoFocus
                onChange={(e) => setText(e.target.value)}
              />
            ) : (
              <input
                type={question.type === 'number' ? 'number' : question.type === 'date' ? 'date' : 'text'}
                value={text}
                autoFocus
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitText()}
              />
            )}
            {question.optional && <p className="hint">{t('ui.optionalHint', locale)}</p>}
            <button
              className="primary"
              disabled={!text.trim() && !question.optional && !skippable}
              onClick={submitText}
            >
              {t('ui.continue', locale)}
            </button>
          </div>
        );

      case 'repeater':
        return (
          <div className="repeater">
            {items.length > 0 && (
              <ul className="items">
                {items.map((item, i) => (
                  <li key={i}>
                    <span>
                      {question.fields?.map((f) => {
                        const v = item[f.id];
                        const label =
                          f.type === 'single'
                            ? t(f.options?.find((o) => o.id === v)?.label ?? '', locale)
                            : v;
                        return label;
                      }).filter(Boolean).join(' · ')}
                    </span>
                    <button
                      className="link"
                      onClick={() => setItems(items.filter((_, j) => j !== i))}
                    >
                      {t('ui.remove', locale)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="item-form">
              {question.fields?.map((f) => (
                <div key={f.id} className="field">
                  <label>{t(f.label, locale)}</label>
                  {f.type === 'text' ? (
                    <input
                      type="text"
                      value={draftItem[f.id] ?? ''}
                      onChange={(e) => setDraftItem({ ...draftItem, [f.id]: e.target.value })}
                    />
                  ) : (
                    <div className="chip-row">
                      {f.options?.map((o) => (
                        <button
                          key={o.id}
                          className={`chip ${draftItem[f.id] === o.id ? 'selected' : ''}`}
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
            <div className="repeater-actions">
              <button className="secondary" disabled={!draftComplete} onClick={addDraft}>
                {t(question.addMore ?? 'ui.addAnother', locale)}
              </button>
              <button
                className="primary"
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
    <div className="question-card" key={question.id}>
      <h2 className="question-text">{t(question.text, locale)}</h2>
      {question.help && <p className="help">{t(question.help, locale)}</p>}
      {body()}
      <div className="card-footer">
        {state.history.length > 0 && (
          <button className="link" onClick={() => dispatch({ type: 'BACK' })}>
            ← {t('ui.back', locale)}
          </button>
        )}
        <span className="spacer" />
        {skippable && (
          <button className="link" onClick={() => dispatch({ type: 'SKIP', qid: question.id })}>
            {t('ui.skip', locale)} →
          </button>
        )}
      </div>
    </div>
  );
}
