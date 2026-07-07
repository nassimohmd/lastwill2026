import { useState } from 'react';
import { useStore } from '../state/store';
import { graph } from '../data/graph';
import { t } from '../i18n';
import { QuestionCard } from './QuestionCard';
import { ProgressBar } from './ProgressBar';
import { WillPreview } from './WillPreview';
import { RepeaterAddMore } from './RepeaterAddMore';
import { generationBlockers } from '../template/render';
import { repeaterIdFromAddMoreScreen } from '../engine/repeaters';

export function App() {
  const { state, dispatch } = useStore();
  const locale = state.meta.locale;
  const [started, setStarted] = useState(false);

  const fresh = state.currentQuestionId === null && state.history.length === 0;
  const finished = state.currentQuestionId === null && state.history.length > 0;
  const inProgress = state.currentQuestionId !== null;

  const startOver = () => {
    if (window.confirm(t('ui.startOver.confirm', locale))) {
      dispatch({ type: 'RESET' });
      setStarted(false);
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
        {inProgress && (
          <button className="link" onClick={startOver}>
            {t('ui.landing.startOver', locale)}
          </button>
        )}
        <p className="lang-note">{t('ui.lang.mlSoon', locale)}</p>
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
      ) : (
        <div className="done">
          <div className="done-header no-print">
            <h2>{t('ui.done.title', locale)}</h2>
            <p>{t('ui.done.lead', locale)}</p>
            <button className="link" onClick={() => dispatch({ type: 'BACK' })}>
              ← {t('ui.done.back', locale)}
            </button>
          </div>
          <WillPreview />
        </div>
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
        {(inProgress || finished) && started && (
          <button className="link" onClick={startOver}>
            {t('ui.landing.startOver', locale)}
          </button>
        )}
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
