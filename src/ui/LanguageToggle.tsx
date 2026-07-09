import { motion } from 'motion/react';
import { t, hasLocale, type Locale } from '../i18n';
import { useStore } from '../state/store';

/** Global interview/UI language switch — every string falls back to English
 *  per key, so this is safe to flip at any point without losing progress. */
export function LanguageToggle() {
  const { state, dispatch } = useStore();
  const locale = state.meta.locale;
  const set = (l: Locale) => dispatch({ type: 'SET_LOCALE', locale: l });

  const tabs: { id: Locale; label: string; disabled?: boolean }[] = [
    { id: 'en', label: t('ui.lang.toggle.en', locale) },
    { id: 'ml', label: t('ui.lang.toggle.ml', locale), disabled: !hasLocale('ml') },
  ];

  return (
    <div
      className="lang-toggle inline-flex gap-1 rounded-full border border-neutral-800 bg-neutral-900/60 p-1"
      role="group"
      aria-label="Language"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`relative rounded-full px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            locale === tab.id ? 'active text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
          disabled={tab.disabled}
          onClick={() => set(tab.id)}
        >
          {locale === tab.id && (
            <motion.div
              layoutId="langToggleActive"
              className="absolute inset-0 -z-10 rounded-full bg-neutral-800/80"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
