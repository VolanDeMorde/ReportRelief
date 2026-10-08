import { useCallback, useEffect, useState } from 'react';

export type View = 'landing' | 'dashboard' | 'faq' | 'about' | 'trash' | 'privacy';

// Each view has its own path so the back button, refresh and deep links work.
// Firebase Hosting rewrites all paths to index.html.
export const VIEW_PATHS: Record<View, string> = {
  landing: '/',
  dashboard: '/app',
  faq: '/faq',
  about: '/about',
  privacy: '/privacy',
  trash: '/trash',
};

const VIEW_TITLES: Record<View, string> = {
  landing: 'ReportRelief | Professional Student Reports in Seconds',
  dashboard: 'Dashboard | ReportRelief',
  faq: 'FAQ | ReportRelief',
  about: 'About | ReportRelief',
  privacy: 'Privacy Policy | ReportRelief',
  trash: 'Trash | ReportRelief',
};

/** Maps a URL path to a view; unknown paths fall back to the landing page. */
export const viewFromPath = (pathname: string): View => {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const match = (Object.keys(VIEW_PATHS) as View[]).find((v) => VIEW_PATHS[v] === normalized);
  return match ?? 'landing';
};

/** History-API routing between the app's views. */
export const useRouting = () => {
  const [currentView, setCurrentViewState] = useState<View>(() =>
    viewFromPath(window.location.pathname)
  );

  const navigate = useCallback((view: View, options?: { replace?: boolean }) => {
    setCurrentViewState(view);
    const path = VIEW_PATHS[view];
    if (window.location.pathname === path) return;
    if (options?.replace) {
      window.history.replaceState({ view }, '', path);
    } else {
      window.history.pushState({ view }, '', path);
      // A new page should start at the top, not at the previous page's scroll position.
      window.scrollTo(0, 0);
    }
  }, []);

  const setCurrentView = useCallback((view: View) => navigate(view), [navigate]);

  // Auto-open the dashboard for returning users, but only from the landing page
  // (never override a deep link such as /privacy) and without adding a history entry.
  const autoOpenDashboard = useCallback(() => {
    if (window.location.pathname === VIEW_PATHS.landing) navigate('dashboard', { replace: true });
  }, [navigate]);

  // Browser back/forward → sync view from URL
  useEffect(() => {
    const onPopState = () => setCurrentViewState(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Normalise unknown paths to the view's path and keep the tab title in sync
  useEffect(() => {
    if (window.location.pathname !== VIEW_PATHS[currentView]) {
      window.history.replaceState({ view: currentView }, '', VIEW_PATHS[currentView]);
    }
    document.title = VIEW_TITLES[currentView];
  }, [currentView]);

  return { currentView, setCurrentView, navigate, autoOpenDashboard };
};
