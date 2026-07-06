import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { FeedPage } from './pages/FeedPage';
import { LoginPage } from './pages/LoginPage';
import { MyStoriesPage } from './pages/MyStoriesPage';
import { SavedPage } from './pages/SavedPage';
import { SearchPage } from './pages/SearchPage';
import { StoryPage } from './pages/StoryPage';
import { SubmitPage } from './pages/SubmitPage';
import { hybridStore } from './storage/hybridStore';

function SessionBootstrap() {
  const { refreshUser } = useAuth();
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);
  return null;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => hybridStore.getPrefs().darkMode);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    hybridStore.setPrefs({ darkMode });
  }, [darkMode]);

  return (
    <AuthProvider>
      <SessionBootstrap />
      <HashRouter>
        <Routes>
          <Route
            element={
              <Layout
                darkMode={darkMode}
                onToggleDark={() => setDarkMode((v) => !v)}
              />
            }
          >
            <Route index element={<FeedPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="submit" element={<SubmitPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="my-stories" element={<MyStoriesPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="story/:id" element={<StoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
