import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { t, hasLocale, type Locale } from '../i18n';
import { useStore } from '../state/store';

/** Global interview/UI language switch — every string falls back to English
 *  per key, so this is safe to flip at any point without losing progress. */
export function LanguageToggle() {
  const { state, dispatch } = useStore();
  const locale = state.meta.locale;

  return (
    <ToggleGroup
      type="single"
      spacing={1}
      value={locale}
      onValueChange={(value) => {
        if (value) dispatch({ type: 'SET_LOCALE', locale: value as Locale });
      }}
      className="lang-toggle rounded-full border border-border bg-muted/40 p-1"
      aria-label="Language"
    >
      <ToggleGroupItem
        value="en"
        className="rounded-full px-4 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
      >
        {t('ui.lang.toggle.en', locale)}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="ml"
        disabled={!hasLocale('ml')}
        className="rounded-full px-4 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
      >
        {t('ui.lang.toggle.ml', locale)}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
