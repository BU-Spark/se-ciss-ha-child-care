export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "zh", label: "Chinese" },
  { code: "ht", label: "Haitian Creole" },
  { code: "vi", label: "Vietnamese" },
  { code: "ar", label: "Arabic" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export function getLanguageLabel(code: string) {
  return (
    SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ??
    code
  );
}

export function isSupportedLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some((language) => language.code === code);
}
