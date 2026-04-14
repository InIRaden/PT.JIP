import React from 'react';
import ReactDOM from 'react-dom/client';
import { useEffect, useState } from 'react';
import App from './app/App';
import { AdminDashboardPage } from './app/pages/AdminDashboardPage';
import { AdminLoginPage } from './app/pages/AdminLoginPage';
import {
  fetchSiteContent,
  getAdminAuth,
  loadSiteContent,
  persistSiteContent,
  persistSiteContentPatch,
  restoreDefaultSiteContent,
  setAdminAuth,
  type SaveResult,
} from './app/data/content-storage';
import type { SiteContent } from './app/types/site-content';
import './styles/index.css';

function isSameContent(a: SiteContent, b: SiteContent): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function RootApp() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => getAdminAuth());
  const [content, setContent] = useState<SiteContent>(() => loadSiteContent());

  useEffect(() => {
    let mounted = true;
    let syncInFlight = false;

    const syncContent = async () => {
      if (syncInFlight) {
        return;
      }

      syncInFlight = true;

      try {
        const fetched = await fetchSiteContent();
        if (!mounted) {
          return;
        }

        setContent((prev) => (isSameContent(prev, fetched) ? prev : fetched));
      } catch {
        // Keep current content if backend is temporarily unreachable.
      } finally {
        syncInFlight = false;
      }
    };

    const onFocus = () => {
      void syncContent();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncContent();
      }
    };

    const refreshInterval = window.setInterval(() => {
      if (!path.startsWith('/admin')) {
        void syncContent();
      }
    }, 15000);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    void syncContent();

    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(refreshInterval);
    };
  }, [path]);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to: string) => {
    if (window.location.pathname === to) {
      return;
    }
    window.history.pushState({}, '', to);
    setPath(to);
  };

  const handleLogin = () => {
    setAdminAuth(true);
    setIsAdminAuthenticated(true);
    navigate('/admin');
  };

  const handleLogout = () => {
    setAdminAuth(false);
    setIsAdminAuthenticated(false);
    navigate('/admin/login');
  };

  const handleSaveContent = async (next: SiteContent): Promise<SaveResult> => {
    const changedPatch: Partial<SiteContent> = {};

    if (JSON.stringify(content.home) !== JSON.stringify(next.home)) {
      changedPatch.home = next.home;
    }
    if (JSON.stringify(content.about) !== JSON.stringify(next.about)) {
      changedPatch.about = next.about;
    }
    if (JSON.stringify(content.services) !== JSON.stringify(next.services)) {
      changedPatch.services = next.services;
    }
    if (JSON.stringify(content.gallery) !== JSON.stringify(next.gallery)) {
      changedPatch.gallery = next.gallery;
    }
    if (JSON.stringify(content.contact) !== JSON.stringify(next.contact)) {
      changedPatch.contact = next.contact;
    }

    if (Object.keys(changedPatch).length === 0) {
      return {
        ok: true,
        savedLocal: false,
        savedRemote: true,
        message: 'Tidak ada perubahan untuk disimpan.',
      };
    }

    const result =
      Object.keys(changedPatch).length === 5
        ? await persistSiteContent(next)
        : await persistSiteContentPatch(changedPatch);

    if (result.ok) {
      try {
        const latest = await fetchSiteContent();
        setContent(latest);
      } catch {
        // Keep intended content if re-fetch fails after successful save.
        setContent(next);
      }
    }

    return result;
  };

  const handleResetContent = async (): Promise<SaveResult> => {
    const reset = await restoreDefaultSiteContent();
    setContent(reset);

    return {
      ok: true,
      savedLocal: false,
      savedRemote: true,
      message: 'Konten berhasil direset ke default.',
    };
  };

  const isAdminRoute = path.startsWith('/admin');

  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return <AdminLoginPage onLoginSuccess={handleLogin} />;
    }

    return (
      <AdminDashboardPage
        content={content}
        onSave={handleSaveContent}
        onReset={handleResetContent}
        onLogout={handleLogout}
      />
    );
  }

  return <App content={content} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
