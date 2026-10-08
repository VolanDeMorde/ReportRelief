import { useCallback, useEffect, useRef, useState } from 'react';

export type DashboardTab = 'generate' | 'reports' | 'profile';

const NOTICE_TOAST_MS = 8000;
const FAB_SCROLL_THRESHOLD_PX = 400;

/** Page-level UI state: messages, menus, modals, tabs, connectivity. */
export const useUiState = () => {
  const [error, setError] = useState<string | null>(null);
  // Non-error confirmation shown as a toast (e.g. after account deletion)
  const [notice, setNotice] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showFab, setShowFab] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('generate');
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  // Scroll → show the back-to-top button
  useEffect(() => {
    const onScroll = () => setShowFab(window.scrollY > FAB_SCROLL_THRESHOLD_PX);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Online/offline
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Escape or click outside → close the account menu
  useEffect(() => {
    if (!showAccountMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAccountMenu(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (accountMenuRef.current && target && !accountMenuRef.current.contains(target)) {
        setShowAccountMenu(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [showAccountMenu]);

  // Auto-dismiss the notice toast
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_TOAST_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const toggleAccountMenu = useCallback(() => setShowAccountMenu((prev) => !prev), []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);

  return {
    error,
    setError,
    notice,
    setNotice,
    isOnline,
    showFab,
    scrollToTop,
    showPricingModal,
    setShowPricingModal,
    showAccountMenu,
    toggleAccountMenu,
    accountMenuRef,
    dashboardTab,
    setDashboardTab,
  };
};
