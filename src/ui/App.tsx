import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { graph } from '../data/graph';
import { t } from '../i18n';
import { QuestionCard } from './QuestionCard';
import { ProgressBar } from './ProgressBar';
import { WillPreview } from './WillPreview';
import { RepeaterAddMore } from './RepeaterAddMore';
import { ReviewScreen } from './ReviewScreen';
import { generationBlockers } from '../template/render';
import { repeaterIdFromAddMoreScreen } from '../engine/repeaters';
import { exportDraft, parseImportedDraft } from '../state/persistence';
import { LanguageToggle } from './LanguageToggle';

export function App() {
  const { state, dispatch } = useStore();
  const locale = state.meta.locale;
  const [started, setStarted] = useState(false);
  const [showWill, setShowWill] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const fresh = state.currentQuestionId === null && state.history.length === 0;
  const finished = state.currentQuestionId === null && state.history.length > 0;
  const inProgress = state.currentQuestionId !== null;

  // if the user edits an earlier answer (from the review or will screen),
  // land back on Review rather than skipping straight to the will next time
  useEffect(() => {
    if (inProgress) setShowWill(false);
  }, [inProgress]);

  const startOver = () => {
    if (window.confirm(t('ui.startOver.confirm', locale))) {
      dispatch({ type: 'RESET' });
      setStarted(false);
      setShowWill(false);
    }
  };

  const importFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseImportedDraft(text);
    if (!parsed) {
      window.alert(t('ui.import.error', locale));
      return;
    }
    if (fresh || window.confirm(t('ui.import.confirmOverwrite', locale))) {
      dispatch({ type: 'LOAD_STATE', state: parsed });
      setStarted(true);
      setShowWill(false);
    }
  };

  let view;
  if (!started && !finished) {
    view = (
      <div className="landing">
        <h1>{t('ui.appName', locale)}</h1>
        <p className="tagline">{t('ui.tagline', locale)}</p>
        <p className="lead">{t('ui.landing.lead', locale)}</p>
        <p className="privacy">{t('ui.landing.privacy', locale)}</p>
        <button
          className="primary big"
          onClick={() => {
            if (fresh) dispatch({ type: 'START' });
            setStarted(true);
          }}
        >
          {inProgress ? t('ui.landing.resume', locale) : t('ui.landing.start', locale)}
        </button>
        <div className="landing-links">
          {inProgress && (
            <button className="link" onClick={startOver}>
              {t('ui.landing.startOver', locale)}
            </button>
          )}
          {inProgress && (
            <button className="link" onClick={() => exportDraft(state)}>
              {t('ui.landing.export', locale)}
            </button>
          )}
          <button className="link" onClick={() => fileInput.current?.click()}>
            {t('ui.landing.import', locale)}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="visually-hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importFile(file);
              e.target.value = '';
            }}
          />
        </div>
        <LanguageToggle />
      </div>
    );
  } else if (finished) {
    const blockers = generationBlockers(state);
    view =
      blockers.length > 0 ? (
        <div className="blocked">
          <h2>{t('ui.blocked.title', locale)}</h2>
          {blockers.includes('underage') && <p>{t('ui.blocked.underage', locale)}</p>}
          {blockers.includes('sound_mind') && (
            <>
              <p>{t('ui.blocked.soundMind', locale)}</p>
              <button
                className="primary"
                onClick={() => dispatch({ type: 'GOTO', qid: 'personal.sound_mind' })}
              >
                {t('ui.done.back', locale)}
              </button>
            </>
          )}
        </div>
      ) : showWill ? (
        <div className="done">
          <div className="done-header no-print">
            <h2>{t('ui.done.title', locale)}</h2>
            <p>{t('ui.done.lead', locale)}</p>
            <button className="link" onClick={() => setShowWill(false)}>
              ← {t('ui.done.back', locale)}
            </button>
          </div>
          <WillPreview />
        </div>
      ) : (
        <ReviewScreen onGenerate={() => setShowWill(true)} />
      );
  } else {
    const repeaterId = state.currentQuestionId ? repeaterIdFromAddMoreScreen(state.currentQuestionId) : null;
    if (repeaterId) {
      view = <RepeaterAddMore repeaterId={repeaterId} />;
    } else {
      const q = state.currentQuestionId ? graph.get(state.currentQuestionId) : null;
      view = q ? <QuestionCard question={q} /> : null;
    }
  }

  return (
    <div className="app">
      <header className="no-print">
        <span className="brand">{t('ui.appName', locale)}</span>
        <div className="header-links">
          {inProgress && started && (
            <button className="link" onClick={() => dispatch({ type: 'RETURN_TO_REVIEW' })}>
              {t('ui.review.backLink', locale)}
            </button>
          )}
          {(inProgress || finished) && started && (
            <button className="link" onClick={startOver}>
              {t('ui.landing.startOver', locale)}
            </button>
          )}
          {started && <LanguageToggle />}
        </div>
      </header>
      {inProgress && started && (
        <div className="no-print">
          <ProgressBar />
        </div>
      )}
      <main>{view}</main>
      <footer className="no-print">{t('ui.disclaimer', locale)}</footer>
    </div>
  );
}
