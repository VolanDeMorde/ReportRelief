import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRouting } from '../useRouting';
import { useTheme } from '../useTheme';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

describe('useRouting', () => {
  it('starts on the view matching the URL', () => {
    window.history.replaceState(null, '', '/privacy');
    const { result } = renderHook(() => useRouting());
    expect(result.current.currentView).toBe('privacy');
    expect(document.title).toContain('Privacy');
  });

  it('normalises unknown paths to "/"', () => {
    window.history.replaceState(null, '', '/does-not-exist');
    renderHook(() => useRouting());
    expect(window.location.pathname).toBe('/');
  });

  it('pushes a history entry and scrolls to top on navigation', () => {
    const { result } = renderHook(() => useRouting());
    const before = window.history.length;
    act(() => result.current.setCurrentView('faq'));
    expect(result.current.currentView).toBe('faq');
    expect(window.location.pathname).toBe('/faq');
    expect(window.history.length).toBe(before + 1);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('follows browser back/forward', () => {
    const { result } = renderHook(() => useRouting());
    act(() => {
      window.history.replaceState(null, '', '/about');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.currentView).toBe('about');
  });

  it('auto-opens the dashboard only from the landing page, without a history entry', () => {
    const { result } = renderHook(() => useRouting());
    const before = window.history.length;
    act(() => result.current.autoOpenDashboard());
    expect(result.current.currentView).toBe('dashboard');
    expect(window.location.pathname).toBe('/app');
    expect(window.history.length).toBe(before);

    act(() => result.current.setCurrentView('privacy'));
    act(() => result.current.autoOpenDashboard());
    expect(result.current.currentView).toBe('privacy');
  });
});

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
  });

  it('follows the OS preference without saving it', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('rb-dark-mode')).toBeNull();
  });

  it('saves an explicit choice', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setIsDarkMode(false));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('rb-dark-mode')).toBe('false');
  });

  it('restores a saved choice over the OS preference', () => {
    localStorage.setItem('rb-dark-mode', 'false');
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDarkMode).toBe(false);
  });
});
