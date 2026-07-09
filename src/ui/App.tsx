import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
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
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { btnLink, easeOut, navLink } from './classes';

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

  // keep the document language in sync so screen readers switch voices
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

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
  let viewKey: string;
  if (!started && !finished) {
    viewKey = 'landing';
    view = (
      <div className="landing pt-[10vh] text-center">
        <h1 className="text-5xl font-light tracking-tight text-foreground sm:text-6xl">
          {t('ui.appName', locale)}
        </h1>
        <p className="tagline mt-3 text-lg text-muted-foreground">{t('ui.tagline', locale)}</p>
        <p className="lead mx-auto mt-7 max-w-md text-sm text-muted-foreground">{t('ui.landing.lead', locale)}</p>
        <p className="privacy mt-5 text-xs text-muted-foreground/70">{t('ui.landing.privacy', locale)}</p>
        <Button
          size="lg"
          className="primary big mt-8 px-8"
          onClick={() => {
            if (fresh) dispatch({ type: 'START' });
            setStarted(true);
          }}
        >
          {inProgress ? t('ui.landing.resume', locale) : t('ui.landing.start', locale)}
        </Button>
        <div className="landing-links mt-4 flex flex-col items-center gap-2">
          {inProgress && (
            <button className={btnLink} onClick={startOver}>
              {t('ui.landing.startOver', locale)}
            </button>
          )}
          {inProgress && (
            <button className={btnLink} onClick={() => exportDraft(state)}>
              {t('ui.landing.export', locale)}
            </button>
          )}
          <button className={btnLink} onClick={() => fileInput.current?.click()}>
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
        <div className="mt-11 flex items-center justify-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    );
  } else if (finished) {
    // the Review screen itself already flags missing requirements (sound-mind
    // confirmation, underage) as warning cards with a "Fix this" jump link —
    // only check blockers when the user actively tries to generate, so
    // "review my answers" always shows the review list, never a wall
    const blockers = showWill ? generationBlockers(state) : [];
    if (blockers.length > 0) {
      viewKey = 'blocked';
      view = (
        <div className="blocked pt-[8vh] text-center">
          <h2 className="text-xl font-light text-foreground">{t('ui.blocked.title', locale)}</h2>
          {blockers.includes('underage') && (
            <p className="mt-3 text-sm text-muted-foreground">{t('ui.blocked.underage', locale)}</p>
          )}
          {blockers.includes('sound_mind') && (
            <>
              <p className="mt-3 text-sm text-muted-foreground">{t('ui.blocked.soundMind', locale)}</p>
              <Button
                size="lg"
                className="primary big mt-6 px-8"
                onClick={() => {
                  setShowWill(false);
                  dispatch({ type: 'GOTO', qid: 'personal.sound_mind' });
                }}
              >
                {t('ui.done.back', locale)}
              </Button>
            </>
          )}
        </div>
      );
    } else if (showWill) {
      viewKey = 'will';
      view = (
        <div className="done">
          <div className="done-header no-print mb-6">
            <h2 className="text-xl font-light text-foreground">{t('ui.done.title', locale)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('ui.done.lead', locale)}</p>
            <button className={`${btnLink} mt-2`} onClick={() => setShowWill(false)}>
              ← {t('ui.done.back', locale)}
            </button>
          </div>
          <WillPreview />
        </div>
      );
    } else {
      viewKey = 'review';
      view = <ReviewScreen onGenerate={() => setShowWill(true)} />;
    }
  } else {
    const repeaterId = state.currentQuestionId ? repeaterIdFromAddMoreScreen(state.currentQuestionId) : null;
    if (repeaterId) {
      viewKey = `addmore-${repeaterId}`;
      view = <RepeaterAddMore repeaterId={repeaterId} />;
    } else {
      const q = state.currentQuestionId ? graph.get(state.currentQuestionId) : null;
      viewKey = state.currentQuestionId ?? 'blank';
      view = q ? <QuestionCard question={q} /> : null;
    }
  }

  // the landing page has its own hero, lead text, and language toggle — a
  // near-empty top bar above it (just the wordmark) doesn't earn its place;
  // the header starts pulling weight once there are nav buttons to hold
  const showHeader = started || finished;

  return (
    <MotionConfig reducedMotion="user">
      <div className="app mx-auto flex min-h-screen max-w-2xl flex-col px-5 pb-16">
        {showHeader && (
          <header className="no-print flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border py-5">
            <span className="brand whitespace-nowrap text-sm font-medium tracking-wide text-foreground">
              {t('ui.appName', locale)}
            </span>
            <div className="header-links flex flex-wrap items-center gap-3 sm:gap-4">
              {inProgress && (
                <button className={navLink} onClick={() => dispatch({ type: 'RETURN_TO_REVIEW' })}>
                  {t('ui.review.backLink', locale)}
                </button>
              )}
              {(inProgress || finished) && (
                <button className={navLink} onClick={startOver}>
                  {t('ui.landing.startOver', locale)}
                </button>
              )}
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
        )}
        {inProgress && started && (
          <div className="no-print pt-7">
            <ProgressBar />
          </div>
        )}
        <main className="flex-1 pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewKey}
              initial={{ opacity: 0, filter: 'blur(8px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)', transition: { duration: 0.3, ease: easeOut } }}
              exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.15, ease: easeOut } }}
            >
              {view}
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="no-print mt-14 text-center text-xs text-muted-foreground/70">
          {t('ui.disclaimer', locale)}
        </footer>
      </div>
    </MotionConfig>
  );
}
