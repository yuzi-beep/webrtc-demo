import { useLocation, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_LOCALE, normalizeLocale } from "@/i18n";

export default function LanguageToggle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useParams<{ locale: string }>();

  const currentLocale = normalizeLocale(locale) ?? DEFAULT_LOCALE;
  const nextLocale = currentLocale === "zh-CN" ? "en-US" : "zh-CN";

  const toggleLanguage = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);

    if (pathSegments.length > 0 && normalizeLocale(pathSegments[0])) {
      pathSegments[0] = nextLocale;
    } else {
      pathSegments.unshift(nextLocale);
    }

    const nextPathname = `/${pathSegments.join("/")}`;
    navigate(`${nextPathname}${location.search}${location.hash}`);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="fixed right-4 top-4 z-60 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 backdrop-blur transition hover:bg-slate-800"
      title={currentLocale === "zh-CN" ? "Switch to English" : "切换到中文"}
      id="toggle-language-btn"
    >
      {currentLocale === "zh-CN" ? "EN" : "中文"}
    </button>
  );
}
