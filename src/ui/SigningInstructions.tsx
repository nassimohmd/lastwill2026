import { t, type Locale } from '../i18n';

const STEPS = [
  'ui.signing.step1',
  'ui.signing.step2',
  'ui.signing.step3',
  'ui.signing.step4',
  'ui.signing.step5',
  'ui.signing.step6',
  'ui.signing.step7',
] as const;

export function SigningInstructions({ locale }: { locale: Locale }) {
  return (
    <div className="signing-page">
      <h2 className="mb-4 text-lg font-light text-neutral-900 dark:text-white">{t('ui.signing.title', locale)}</h2>
      <ol className="list-decimal pl-5">
        {STEPS.map((key, i) => (
          <li key={i} className="mb-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            {t(key, locale)}
          </li>
        ))}
      </ol>
      <p className="hint mt-3 text-sm text-neutral-500">{t('ui.signing.note', locale)}</p>
    </div>
  );
}
