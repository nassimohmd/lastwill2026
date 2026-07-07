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
      <h2>{t('ui.signing.title', locale)}</h2>
      <ol>
        {STEPS.map((key, i) => (
          <li key={i}>{t(key, locale)}</li>
        ))}
      </ol>
      <p className="hint">{t('ui.signing.note', locale)}</p>
    </div>
  );
}
