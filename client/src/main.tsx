import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useParams,
} from 'react-router-dom';
import './index.css';
import i18n, {
  DEFAULT_LOCALE,
  getPreferredLocale,
  normalizeLocale,
} from './i18n';
import HomePage from './pages/home';
import RoomPage from './pages/room';
import { useEffect } from 'react';

export function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>();
  const location = useLocation();
  const normalizedLocale = normalizeLocale(locale);

  useEffect(() => {
    if (!normalizedLocale) return;
    if (i18n.resolvedLanguage !== normalizedLocale) {
      void i18n.changeLanguage(normalizedLocale);
    }
    document.documentElement.lang = normalizedLocale;
  }, [normalizedLocale]);

  if (!normalizedLocale) {
    const preferredLocale = getPreferredLocale();
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const restPath = pathSegments.length > 1 ? `/${pathSegments.slice(1).join('/')}` : '';
    const search = location.search ?? '';
    const hash = location.hash ?? '';
    return (
      <Navigate
        replace
        to={`/${preferredLocale}${restPath}${search}${hash}`}
      />
    );
  }

  return <Outlet />;
}

export function LocaleRootRedirect() {
  const preferredLocale = getPreferredLocale();
  return <Navigate replace to={`/${preferredLocale}`} />;
}

export function LegacyRoomRedirect() {
  const { roomId } = useParams<{ roomId: string }>();
  return <Navigate replace to={`/${DEFAULT_LOCALE}/room/${roomId ?? ''}`} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LocaleRootRedirect />} />
        <Route path="/room/:roomId" element={<LegacyRoomRedirect />} />
        <Route path="/:locale" element={<LocaleLayout />}>
          <Route index element={<HomePage />} />
          <Route path="room/:roomId" element={<RoomPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
