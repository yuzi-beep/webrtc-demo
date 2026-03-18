import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, type AppLocale } from "./resources";

export const supportedLocales: AppLocale[] = ["zh-CN", "en-US"];
export const DEFAULT_LOCALE: AppLocale = "zh-CN";

export function normalizeLocale(input?: string | null): AppLocale | undefined {
  if (!input) return undefined;
  const value = input.trim();
  if (supportedLocales.includes(value as AppLocale)) {
    return value as AppLocale;
  }
  if (value.toLowerCase().startsWith("zh")) return "zh-CN";
  if (value.toLowerCase().startsWith("en")) return "en-US";
  return undefined;
}

function resolveLocaleFromPath(pathname: string): AppLocale | undefined {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return normalizeLocale(firstSegment);
}

export function getPreferredLocale(): AppLocale {
  const localeFromPath = resolveLocaleFromPath(window.location.pathname);
  if (localeFromPath) return localeFromPath;

  const browserLocale = normalizeLocale(navigator.language);
  if (browserLocale) return browserLocale;

  return DEFAULT_LOCALE;
}

const initialLocale = getPreferredLocale();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: "en-US",
  interpolation: {
    escapeValue: false,
  },
});
export default i18n;
