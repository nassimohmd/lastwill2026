import { t, hasLocale, type Locale } from '../i18n';
import { useStore } from '../state/store';

/** Global interview/UI language switch — every string falls back to English
 *  per key, so this is safe to flip at any point without losing progress. */
export function LanguageToggle() {
  const { state, dispatch } = useStore();
  const locale = state.meta.locale;
  const set = (l: Locale) => dispatch({ type: 'SET_LOCALE', locale: l });

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button className={locale === 'en' ? 'active' : ''} onClick={() => set('en')}>
        {t('ui.lang.toggle.en', locale)}
      </button>
      <button
        className={locale === 'ml' ? 'active' : ''}
        onClick={() => set('ml')}
        disabled={!hasLocale('ml')}
      >
        {t('ui.lang.toggle.ml', locale)}
      </button>
    </div>
  );
}
